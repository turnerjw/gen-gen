import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export interface GenerateOptions {
  input?: string;
  cwd?: string;
  markerText?: string;
  write?: boolean;
  deepMerge?: boolean;
}

export interface GenerateResult {
  inputPath: string;
  changed: boolean;
  content: string;
  watchedFiles: string[];
  warnings: string[];
}

interface TargetSpec {
  functionName: string;
  typeText: string;
  type: ts.Type;
}

interface NestedHelperSpec {
  helperName: string;
  propertyName: string;
  typeExpression: string;
  baseExpression: string;
}

interface GenerationContext {
  checker: ts.TypeChecker;
  sourceFile: ts.SourceFile;
  typeToFunctionName: Map<string, string>;
  activeTypes: Set<string>;
  maxDepth: number;
}

const DEFAULT_INPUT = "data-gen.ts";
const DEFAULT_MARKER_TEXT = "Generated below - DO NOT EDIT";

export async function generateDataFile(options: GenerateOptions = {}): Promise<GenerateResult> {
  const cwd = options.cwd ?? process.cwd();
  const markerText = options.markerText ?? DEFAULT_MARKER_TEXT;
  const inputPath = path.resolve(cwd, options.input ?? DEFAULT_INPUT);
  const write = options.write ?? true;

  const original = await fs.readFile(inputPath, "utf8");
  const parsed = parseTargets(inputPath);
  const generated = emitFunctions(parsed.targets, parsed.checker, parsed.sourceFile, options.deepMerge ?? false);

  let next = ensureFakerImport(original);
  next = replaceGeneratedSection(next, generated, markerText);

  const changed = original !== next;
  if (write && changed) {
    await fs.writeFile(inputPath, next, "utf8");
  }

  return {
    inputPath,
    changed,
    content: next,
    watchedFiles: parsed.watchedFiles,
    warnings: parsed.warnings,
  };
}

function parseTargets(inputPath: string): {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
  targets: TargetSpec[];
  warnings: string[];
  watchedFiles: string[];
} {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
  };

  const program = ts.createProgram([inputPath], compilerOptions);
  const sourceFile = program.getSourceFile(inputPath);
  if (!sourceFile) {
    throw new Error(`Unable to load source file: ${inputPath}`);
  }

  const checker = program.getTypeChecker();
  const warnings: string[] = [];
  const targets: TargetSpec[] = [];

  const importTargets = collectImportedTargets(sourceFile, checker, warnings);
  targets.push(...importTargets);

  const concreteGenericNodes = collectConcreteGenericNodes(sourceFile);
  for (const node of concreteGenericNodes) {
    const type = checker.getTypeFromTypeNode(node);
    const typeText = node.getText(sourceFile);

    targets.push({
      functionName: `generate${buildFunctionSuffixFromTypeNode(node)}`,
      typeText,
      type,
    });
  }

  const uniqueTargets = dedupeTargets(targets);

  const watchedFiles = program
    .getSourceFiles()
    .map((file) => path.resolve(file.fileName))
    .filter((fileName) => !fileName.includes("/node_modules/") && !fileName.endsWith(".d.ts"));

  return {
    sourceFile,
    checker,
    targets: uniqueTargets,
    warnings,
    watchedFiles,
  };
}

function collectImportedTargets(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  warnings: string[],
): TargetSpec[] {
  const targets: TargetSpec[] = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    const clause = statement.importClause;
    if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) {
      continue;
    }

    for (const element of clause.namedBindings.elements) {
      if (clause.isTypeOnly || element.isTypeOnly) {
        const symbol = checker.getSymbolAtLocation(element.name);
        if (!symbol) {
          warnings.push(`Skipped imported type \"${element.name.text}\": unable to resolve symbol.`);
          continue;
        }

        const resolvedSymbol = (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
        if (isGenericDeclaration(resolvedSymbol)) {
          warnings.push(`Skipped imported type \"${element.name.text}\": generic type requires ConcreteGenerics entry.`);
          continue;
        }

        targets.push({
          functionName: `generate${element.name.text}`,
          typeText: element.name.text,
          type: checker.getDeclaredTypeOfSymbol(resolvedSymbol),
        });
      }
    }
  }

  return targets;
}

function collectConcreteGenericNodes(sourceFile: ts.SourceFile): ts.TypeNode[] {
  for (const statement of sourceFile.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) {
      continue;
    }

    if (statement.name.text !== "ConcreteGenerics") {
      continue;
    }

    if (!ts.isTupleTypeNode(statement.type)) {
      return [];
    }

    return [...statement.type.elements];
  }

  return [];
}

function isGenericDeclaration(symbol: ts.Symbol): boolean {
  return (symbol.declarations ?? []).some((declaration) => {
    if (
      ts.isTypeAliasDeclaration(declaration) ||
      ts.isInterfaceDeclaration(declaration) ||
      ts.isClassDeclaration(declaration)
    ) {
      return (declaration.typeParameters?.length ?? 0) > 0;
    }

    return false;
  });
}

function dedupeTargets(targets: TargetSpec[]): TargetSpec[] {
  const byTypeText = new Map<string, TargetSpec>();

  for (const target of targets) {
    if (!byTypeText.has(target.typeText)) {
      byTypeText.set(target.typeText, target);
    }
  }

  return [...byTypeText.values()];
}

function emitFunctions(targets: TargetSpec[], checker: ts.TypeChecker, sourceFile: ts.SourceFile, deepMerge: boolean): string {
  const typeToFunctionName = new Map<string, string>();

  for (const target of targets) {
    const typeId = checker.typeToString(target.type, sourceFile, ts.TypeFormatFlags.NoTruncation);
    typeToFunctionName.set(typeId, target.functionName);
  }

  const context: GenerationContext = {
    checker,
    sourceFile,
    typeToFunctionName,
    activeTypes: new Set<string>(),
    maxDepth: 8,
  };

  const sections: string[] = [emitSharedHelperRuntime(deepMerge)];
  sections.push(...targets.map((target) => emitFunction(target, context)));
  return sections.join("\n\n");
}

function emitFunction(target: TargetSpec, context: GenerationContext): string {
  const callbackTypeName = `${toPascalCase(target.functionName)}CallbackParam`;
  const body = emitObjectLiteral(target.type, context, 1, target.typeText);
  const baseBlock = formatAssignmentBlock(`  const base: ${target.typeText} =`, body);

  return [
    `export type ${callbackTypeName} = (helpers: GenGenHelpers<${target.typeText}>) => Partial<${target.typeText}>;`,
    ``,
    `export function ${target.functionName}(overrides?: Partial<${target.typeText}> | ${callbackTypeName}): ${target.typeText} {`,
    baseBlock,
    `  const generate = __genGenCreateHelper(base);`,
    `  return generate(overrides);`,
    `}`,
  ].join("\n");
}

function emitObjectLiteral(
  type: ts.Type,
  context: GenerationContext,
  depth: number,
  fallbackTypeText: string,
): string {
  const checker = context.checker;
  const properties = checker.getPropertiesOfType(type);

  const lines: string[] = ["{"];

  for (const property of properties) {
    const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? context.sourceFile;
    const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
    const expression = emitExpression(propertyType, context, depth + 1, fallbackTypeText);
    const propertyName = needsQuotedProperty(property.name) ? JSON.stringify(property.name) : property.name;
    lines.push(`  ${propertyName}: ${expression},`);
  }

  lines.push("}");

  return lines.join("\n");
}

function emitSharedHelperRuntime(deepMerge: boolean): string {
  const returnLine = deepMerge
    ? "    return __genGenMergeDeep(base, resolvedOverrides);"
    : "    return { ...base, ...resolvedOverrides };";

  return [
    "type __GenGenPlainObject<T> = T extends object",
    "  ? T extends readonly unknown[]",
    "    ? never",
    "    : T extends (...args: any[]) => any",
    "      ? never",
    "      : T extends Date",
    "        ? never",
    "        : T",
    "  : never;",
    "",
    "type GenGenHelpers<T extends object> = {",
    "  [K in keyof T as __GenGenPlainObject<NonNullable<T[K]>> extends never",
    "    ? never",
    "    : `generate${Capitalize<string & K>}`]: (",
    "      overrides?: GenGenOverrides<__GenGenPlainObject<NonNullable<T[K]>>>,",
    "    ) => __GenGenPlainObject<NonNullable<T[K]>>;",
    "};",
    "",
    "type GenGenOverrides<T extends object> = Partial<T> | ((helpers: GenGenHelpers<T>) => Partial<T>);",
    "",
    "function __genGenIsMergeable(value: unknown): value is Record<string, unknown> {",
    "  return !!value && typeof value === \"object\" && !Array.isArray(value) && !(value instanceof Date);",
    "}",
    "",
    "function __genGenMergeDeep<T>(base: T, overrides: Partial<T> | undefined): T {",
    "  if (!overrides) {",
    "    return base;",
    "  }",
    "",
    "  if (!__genGenIsMergeable(base) || !__genGenIsMergeable(overrides)) {",
    "    return overrides as T;",
    "  }",
    "",
    "  const result: Record<string, unknown> = { ...base };",
    "  for (const [key, overrideValue] of Object.entries(overrides)) {",
    "    const baseValue = result[key];",
    "    if (__genGenIsMergeable(baseValue) && __genGenIsMergeable(overrideValue)) {",
    "      result[key] = __genGenMergeDeep(baseValue, overrideValue);",
    "      continue;",
    "    }",
    "",
    "    result[key] = overrideValue;",
    "  }",
    "",
    "  return result as T;",
    "}",
    "",
    "function __genGenCreateHelper<T extends object>(",
    "  base: T,",
    "  helperCache: WeakMap<object, unknown> = new WeakMap(),",
    "): (overrides?: GenGenOverrides<T>) => T {",
    "  const cached = helperCache.get(base as object);",
    "  if (cached) {",
    "    return cached as (overrides?: GenGenOverrides<T>) => T;",
    "  }",
    "",
    "  const generate = (overrides?: GenGenOverrides<T>): T => {",
    "    const helpers = {} as GenGenHelpers<T>;",
    "    for (const [key, value] of Object.entries(base as Record<string, unknown>)) {",
    "      if (!__genGenIsMergeable(value)) {",
    "        continue;",
    "      }",
    "",
    "      const helperName = `generate${key[0]?.toUpperCase() ?? \"\"}${key.slice(1)}`;",
    "      (helpers as Record<string, unknown>)[helperName] = __genGenCreateHelper(value, helperCache);",
    "    }",
    "",
    "    const resolvedOverrides: Partial<T> | undefined =",
    "      typeof overrides === \"function\"",
    "        ? (overrides as (nestedHelpers: GenGenHelpers<T>) => Partial<T>)(helpers)",
    "        : overrides;",
    "",
    returnLine,
    "  };",
    "",
    "  helperCache.set(base as object, generate);",
    "  return generate;",
    "}",
  ].join("\n");
}

function emitExpression(type: ts.Type, context: GenerationContext, depth: number, fallbackTypeText: string): string {
  const checker = context.checker;

  if (type.isStringLiteral()) {
    return JSON.stringify(type.value);
  }

  if (type.isNumberLiteral()) {
    return String(type.value);
  }

  if (type.flags & ts.TypeFlags.BooleanLiteral) {
    return checker.typeToString(type, context.sourceFile, ts.TypeFormatFlags.NoTruncation) === "true" ? "true" : "false";
  }

  if (type.flags & ts.TypeFlags.String) {
    return "faker.word.noun()";
  }

  if (type.flags & ts.TypeFlags.Number) {
    return "faker.number.int({ min: 1, max: 1000 })";
  }

  if (type.flags & ts.TypeFlags.Boolean) {
    return "faker.datatype.boolean()";
  }

  if (type.flags & ts.TypeFlags.BigInt) {
    return "BigInt(faker.number.int({ min: 1, max: 1000 }))";
  }

  if (type.flags & ts.TypeFlags.Null) {
    return "null";
  }

  if (type.flags & ts.TypeFlags.Undefined) {
    return "undefined";
  }

  if (type.flags & ts.TypeFlags.Union) {
    const union = type as ts.UnionType;
    const nullType = union.types.find((member) => (member.flags & ts.TypeFlags.Null) !== 0);
    const undefinedType = union.types.find((member) => (member.flags & ts.TypeFlags.Undefined) !== 0);
    const concreteMembers = union.types.filter(
      (member) => (member.flags & ts.TypeFlags.Null) === 0 && (member.flags & ts.TypeFlags.Undefined) === 0,
    );

    if (concreteMembers.length === 1 && nullType) {
      const presentType = concreteMembers[0];
      if (!presentType) {
        return "null";
      }
      const whenPresent = emitExpression(presentType, context, depth + 1, fallbackTypeText);
      return `faker.datatype.boolean() ? ${whenPresent} : null`;
    }

    if (concreteMembers.length === 1 && undefinedType) {
      const presentType = concreteMembers[0];
      if (!presentType) {
        return "undefined";
      }
      const whenPresent = emitExpression(presentType, context, depth + 1, fallbackTypeText);
      return `faker.datatype.boolean() ? ${whenPresent} : undefined`;
    }

    if (concreteMembers.length > 0) {
      if (areAllStringLiterals(concreteMembers)) {
        const values = concreteMembers.map((member) => JSON.stringify((member as ts.StringLiteralType).value));
        return `faker.helpers.arrayElement([${values.join(", ")}])`;
      }

      if (areAllNumberLiterals(concreteMembers)) {
        const values = concreteMembers.map((member) => String((member as ts.NumberLiteralType).value));
        return `faker.helpers.arrayElement([${values.join(", ")}])`;
      }

      if (areAllBooleanLiterals(concreteMembers)) {
        const values = concreteMembers.map((member) =>
          checker.typeToString(member, context.sourceFile, ts.TypeFormatFlags.NoTruncation) === "true" ? "true" : "false",
        );
        const unique = [...new Set(values)];
        if (unique.length === 1) {
          return unique[0] ?? "false";
        }
        return "faker.datatype.boolean()";
      }

      if (concreteMembers.every((member) => (member.flags & ts.TypeFlags.Object) !== 0)) {
        const branches = concreteMembers.map((member) => emitExpression(member, context, depth + 1, fallbackTypeText));
        return `faker.helpers.arrayElement([${branches.join(", ")}])`;
      }

      const firstMember = concreteMembers[0];
      if (!firstMember) {
        return "undefined";
      }
      return emitExpression(firstMember, context, depth + 1, fallbackTypeText);
    }

    return "undefined";
  }

  const normalizedTypeText = checker.typeToString(type, context.sourceFile, ts.TypeFormatFlags.NoTruncation);
  if (normalizedTypeText === "string") {
    return "faker.word.noun()";
  }
  if (normalizedTypeText === "number") {
    return "faker.number.int({ min: 1, max: 1000 })";
  }
  if (normalizedTypeText === "boolean") {
    return "faker.datatype.boolean()";
  }
  if (normalizedTypeText === "bigint") {
    return "BigInt(faker.number.int({ min: 1, max: 1000 }))";
  }

  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    const ref = type as ts.TypeReference;
    const [itemType] = checker.getTypeArguments(ref);
    const itemExpression = itemType
      ? emitExpression(itemType, context, depth + 1, checker.typeToString(itemType, context.sourceFile, ts.TypeFormatFlags.NoTruncation))
      : "faker.word.noun()";

    return `Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ${itemExpression})`;
  }

  const typeText = normalizedTypeText;
  const generatorName = context.typeToFunctionName.get(typeText);
  if (generatorName) {
    return `${generatorName}()`;
  }

  if (isDateType(type)) {
    return "faker.date.recent()";
  }

  if (type.flags & ts.TypeFlags.Any) {
    return "faker.word.noun() as any";
  }

  if (type.flags & ts.TypeFlags.Unknown) {
    return "faker.word.noun() as unknown";
  }

  if ((type.flags & ts.TypeFlags.Object) !== 0) {
    if (depth > context.maxDepth) {
      return `{} as ${typeText}`;
    }

    if (context.activeTypes.has(typeText)) {
      return `{} as ${typeText}`;
    }

    context.activeTypes.add(typeText);
    const nested = emitInlineObject(type, context, depth + 1, typeText);
    context.activeTypes.delete(typeText);
    return nested;
  }

  return `{} as ${typeText}`;
}

function areAllStringLiterals(types: ts.Type[]): boolean {
  return types.length > 0 && types.every((type) => type.isStringLiteral());
}

function areAllNumberLiterals(types: ts.Type[]): boolean {
  return types.length > 0 && types.every((type) => type.isNumberLiteral());
}

function areAllBooleanLiterals(types: ts.Type[]): boolean {
  return types.length > 0 && types.every((type) => (type.flags & ts.TypeFlags.BooleanLiteral) !== 0);
}

function emitCallbackType(target: TargetSpec, callbackTypeName: string, nestedHelpers: NestedHelperSpec[]): string {
  if (nestedHelpers.length === 0) {
    return `export type ${callbackTypeName} = () => Partial<${target.typeText}>;`;
  }

  const fields = nestedHelpers.map((helper) => {
    return `${helper.helperName}: (overrides?: Partial<${helper.typeExpression}>) => ${helper.typeExpression};`;
  });

  return `export type ${callbackTypeName} = (helpers: { ${fields.join(" ")} }) => Partial<${target.typeText}>;`;
}

function emitResolvedOverrides(target: TargetSpec, nestedHelpers: NestedHelperSpec[], callbackTypeName: string): string {
  if (nestedHelpers.length === 0) {
    return [
      `  const resolvedOverrides: Partial<${target.typeText}> | undefined =`,
      `    typeof overrides === "function" ? (overrides as ${callbackTypeName})() : overrides;`,
    ].join("\n");
  }

  const helperEntries = nestedHelpers.map((helper) => {
    return `${helper.helperName}: (nestedOverrides?: Partial<${helper.typeExpression}>) => ({ ...${helper.baseExpression}, ...nestedOverrides }) as ${helper.typeExpression},`;
  });

  return [
    `  const resolvedOverrides: Partial<${target.typeText}> | undefined =`,
    `    typeof overrides === "function"`,
    `      ? (overrides as ${callbackTypeName})({`,
    ...helperEntries.map((entry) => `          ${entry}`),
    `        })`,
    `      : overrides;`,
  ].join("\n");
}

function collectNestedHelpers(target: TargetSpec, context: GenerationContext): NestedHelperSpec[] {
  const checker = context.checker;
  const properties = checker.getPropertiesOfType(target.type);
  const helpers: NestedHelperSpec[] = [];

  for (const property of properties) {
    const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? context.sourceFile;
    const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
    const objectType = extractObjectType(propertyType);
    if (!objectType) {
      continue;
    }

    const propertyName = property.name;
    const helperName = `generate${toPascalCase(propertyName)}`;
    const typeExpression = `${target.typeText}[${JSON.stringify(propertyName)}]`;
    const baseExpression = emitExpression(objectType, context, 2, typeExpression);

    helpers.push({
      helperName,
      propertyName,
      typeExpression,
      baseExpression,
    });
  }

  return dedupeNestedHelpers(helpers);
}

function dedupeNestedHelpers(helpers: NestedHelperSpec[]): NestedHelperSpec[] {
  const seen = new Set<string>();
  const deduped: NestedHelperSpec[] = [];

  for (const helper of helpers) {
    if (seen.has(helper.helperName)) {
      continue;
    }
    seen.add(helper.helperName);
    deduped.push(helper);
  }

  return deduped;
}

function extractObjectType(type: ts.Type): ts.Type | null {
  if ((type.flags & ts.TypeFlags.Union) !== 0) {
    const union = type as ts.UnionType;
    const concreteMembers = union.types.filter(
      (member) => (member.flags & ts.TypeFlags.Null) === 0 && (member.flags & ts.TypeFlags.Undefined) === 0,
    );
    if (concreteMembers.length !== 1) {
      return null;
    }
    const concreteMember = concreteMembers[0];
    if (!concreteMember) {
      return null;
    }
    return extractObjectType(concreteMember);
  }

  if ((type.flags & ts.TypeFlags.Object) === 0) {
    return null;
  }

  const checkerType = type as ts.ObjectType;
  if ((checkerType.objectFlags & ts.ObjectFlags.Reference) !== 0) {
    return type;
  }

  if ((checkerType.objectFlags & ts.ObjectFlags.Tuple) !== 0) {
    return null;
  }

  return type;
}

function emitInlineObject(type: ts.Type, context: GenerationContext, depth: number, typeText: string): string {
  const checker = context.checker;
  const properties = checker.getPropertiesOfType(type);
  if (properties.length === 0) {
    return `{} as ${typeText}`;
  }

  const lines: string[] = ["{"];

  for (const property of properties) {
    const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? context.sourceFile;
    const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
    const expression = emitExpression(propertyType, context, depth + 1, checker.typeToString(propertyType));
    const propertyName = needsQuotedProperty(property.name) ? JSON.stringify(property.name) : property.name;
    lines.push(`  ${propertyName}: ${expression},`);
  }

  lines.push("}");
  return lines.join("\n");
}

function ensureFakerImport(source: string): string {
  if (source.includes("@faker-js/faker")) {
    return source;
  }

  const importRegex = /^import[^\n]*\n/gm;
  let lastImportEnd = 0;

  for (const match of source.matchAll(importRegex)) {
    const end = (match.index ?? 0) + match[0].length;
    if (end > lastImportEnd) {
      lastImportEnd = end;
    }
  }

  const fakerImport = 'import {faker} from "@faker-js/faker";\n';

  if (lastImportEnd > 0) {
    return `${source.slice(0, lastImportEnd)}${fakerImport}${source.slice(lastImportEnd)}`;
  }

  return `${fakerImport}\n${source}`;
}

function replaceGeneratedSection(source: string, generatedContent: string, markerText: string): string {
  const markerBlock = findMarkerBlock(source, markerText);
  const generatedSection = `\n\n${generatedContent}\n`;

  if (!markerBlock) {
    const marker = `/**\n * ${markerText}\n */`;
    return `${source.trimEnd()}\n\n${marker}${generatedSection}`;
  }

  const prefix = source.slice(0, markerBlock.end).trimEnd();
  return `${prefix}${generatedSection}`;
}

function findMarkerBlock(source: string, markerText: string): { start: number; end: number } | null {
  const blockRegex = /\/\*\*[\s\S]*?\*\//gm;
  for (const match of source.matchAll(blockRegex)) {
    if (match[0].includes(markerText)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      return { start, end };
    }
  }

  const lineIndex = source.indexOf(markerText);
  if (lineIndex === -1) {
    return null;
  }

  const lineEnd = source.indexOf("\n", lineIndex);
  return {
    start: lineIndex,
    end: lineEnd === -1 ? source.length : lineEnd,
  };
}

function buildFunctionSuffixFromTypeNode(node: ts.TypeNode): string {
  if (ts.isTypeReferenceNode(node)) {
    const baseName = getEntityNameText(node.typeName);
    if (!node.typeArguments || node.typeArguments.length === 0) {
      return sanitizeIdentifier(baseName);
    }

    const argumentParts = node.typeArguments.map((argument) => buildFunctionSuffixFromTypeNode(argument));
    return sanitizeIdentifier(`${argumentParts.join("")}${baseName}`);
  }

  if (ts.isArrayTypeNode(node)) {
    return sanitizeIdentifier(`${buildFunctionSuffixFromTypeNode(node.elementType)}Array`);
  }

  if (ts.isParenthesizedTypeNode(node)) {
    return buildFunctionSuffixFromTypeNode(node.type);
  }

  if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
    return sanitizeIdentifier(node.types.map((type) => buildFunctionSuffixFromTypeNode(type)).join(""));
  }

  return sanitizeIdentifier(node.getText());
}

function getEntityNameText(entityName: ts.EntityName): string {
  if (ts.isIdentifier(entityName)) {
    return entityName.text;
  }

  return entityName.right.text;
}

function sanitizeIdentifier(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_$]/g, "");
  return cleaned.length > 0 ? cleaned : "Type";
}

function toPascalCase(value: string): string {
  const parts = value
    .split(/[^a-zA-Z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => {
      const first = part[0];
      if (!first) {
        return "";
      }
      return first.toUpperCase() + part.slice(1);
    });

  const joined = parts.join("");
  if (joined.length > 0) {
    return joined;
  }

  return sanitizeIdentifier(value);
}

function isDateType(type: ts.Type): boolean {
  return type.symbol?.getName() === "Date";
}

function needsQuotedProperty(name: string): boolean {
  return !/^[$A-Z_][0-9A-Z_$]*$/i.test(name);
}

function formatReturnBlock(objectLiteral: string): string {
  const lines = objectLiteral.split("\n");
  if (lines.length === 0) {
    return "  return {};";
  }

  const [first, ...rest] = lines;
  const output = [`  return ${first}`];
  for (const line of rest) {
    output.push(`  ${line}`);
  }

  const last = output[output.length - 1];
  output[output.length - 1] = `${last};`;

  return output.join("\n");
}

function formatAssignmentBlock(prefix: string, objectLiteral: string): string {
  const lines = objectLiteral.split("\n");
  if (lines.length === 0) {
    return `${prefix} {};`;
  }

  const [first, ...rest] = lines;
  const output = [`${prefix} ${first}`];
  for (const line of rest) {
    output.push(`  ${line}`);
  }

  const last = output[output.length - 1];
  output[output.length - 1] = `${last};`;
  return output.join("\n");
}
