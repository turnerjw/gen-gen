import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export interface GenerateOptions {
  input?: string;
  cwd?: string;
  markerText?: string;
  write?: boolean;
  failOnWarn?: boolean;
  propertyPolicy?: Partial<PropertyPolicy>;
  deepMerge?: boolean;
  include?: string[];
  exclude?: string[];
  fakerOverrides?: Record<string, FakerOverrideInput>;
}

export type FakerOverrideInput = string | ((faker: typeof import("@faker-js/faker").faker) => unknown);

export interface GenerateResult {
  inputPath: string;
  changed: boolean;
  content: string;
  watchedFiles: string[];
  warnings: string[];
}

export interface PropertyPolicy {
  optionalProperties: "include" | "omit";
  readonlyProperties: "include" | "warn";
  indexSignatures: "ignore" | "warn";
}

interface TargetSpec {
  functionName: string;
  typeText: string;
  type: ts.Type;
}

interface FakerOverrideSpec {
  sourceKey: string;
  expression: string;
  invokeMode: "raw" | "call" | "callWithFaker";
}

interface GenerationContext {
  checker: ts.TypeChecker;
  sourceFile: ts.SourceFile;
  typeToFunctionName: Map<string, string>;
  activeTypes: Set<string>;
  maxDepth: number;
  fakerOverrides: Map<string, FakerOverrideSpec>;
  usedFakerOverrideKeys: Set<string>;
  policy: PropertyPolicy;
  emittedWarnings: Set<string>;
}

const DEFAULT_INPUT = "data-gen.ts";
const DEFAULT_MARKER_TEXT = "Generated below - DO NOT EDIT";
const DEFAULT_PROPERTY_POLICY: PropertyPolicy = {
  optionalProperties: "include",
  readonlyProperties: "include",
  indexSignatures: "ignore",
};

export async function generateDataFile(options: GenerateOptions = {}): Promise<GenerateResult> {
  const cwd = options.cwd ?? process.cwd();
  const markerText = options.markerText ?? DEFAULT_MARKER_TEXT;
  const inputPath = path.resolve(cwd, options.input ?? DEFAULT_INPUT);
  const write = options.write ?? true;

  const original = await fs.readFile(inputPath, "utf8");
  const parsed = parseTargets(inputPath, {
    include: options.include ?? [],
    exclude: options.exclude ?? [],
    fakerOverrides: options.fakerOverrides ?? {},
  });
  const emitted = emitFunctions(
    parsed.targets,
    parsed.checker,
    parsed.sourceFile,
    options.deepMerge ?? false,
    parsed.fakerOverrides,
    resolvePropertyPolicy(options.propertyPolicy),
  );
  const warnings = [
    ...parsed.warnings,
    ...emitted.warnings,
    ...collectUnusedFakerOverrideWarnings(parsed.fakerOverrides, emitted.usedFakerOverrideKeys),
  ];
  if (options.failOnWarn && warnings.length > 0) {
    throw new Error(buildFailOnWarnMessage(warnings));
  }

  let next = ensureFakerImport(original);
  next = replaceGeneratedSection(next, emitted.content, markerText);

  const changed = original !== next;
  if (write && changed) {
    await fs.writeFile(inputPath, next, "utf8");
  }

  return {
    inputPath,
    changed,
    content: next,
    watchedFiles: parsed.watchedFiles,
    warnings,
  };
}

function buildFailOnWarnMessage(warnings: string[]): string {
  return `Generation failed due to warnings:\n${warnings.map((warning) => `- ${warning}`).join("\n")}`;
}

function resolvePropertyPolicy(policy: Partial<PropertyPolicy> | undefined): PropertyPolicy {
  return {
    optionalProperties: policy?.optionalProperties ?? DEFAULT_PROPERTY_POLICY.optionalProperties,
    readonlyProperties: policy?.readonlyProperties ?? DEFAULT_PROPERTY_POLICY.readonlyProperties,
    indexSignatures: policy?.indexSignatures ?? DEFAULT_PROPERTY_POLICY.indexSignatures,
  };
}

function parseTargets(
  inputPath: string,
  filterOptions: {
    include: string[];
    exclude: string[];
    fakerOverrides: Record<string, FakerOverrideInput>;
  },
): {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
  targets: TargetSpec[];
  warnings: string[];
  watchedFiles: string[];
  fakerOverrides: Map<string, FakerOverrideSpec>;
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
    if (isIgnoredType(type)) {
      warnings.push(`Skipped ConcreteGenerics entry \"${typeText}\": marked with @gen-gen-ignore.`);
      continue;
    }

    if (!isGeneratableRootType(type, checker)) {
      warnings.push(`Skipped ConcreteGenerics entry \"${typeText}\": only object types are supported for generators.`);
      continue;
    }

    targets.push({
      functionName: `generate${buildFunctionSuffixFromTypeNode(node)}`,
      typeText,
      type,
    });
  }

  const inFileInclude = collectTupleTypeEntries(sourceFile, "IncludeGenerators");
  const inFileExclude = collectTupleTypeEntries(sourceFile, "ExcludeGenerators");
  const inFileFakerOverrides = collectFakerOverrides(sourceFile, warnings);
  const fakerOverrides = new Map<string, FakerOverrideSpec>();
  for (const [key, value] of Object.entries(inFileFakerOverrides)) {
    fakerOverrides.set(normalizeFilterKey(key), value);
  }
  for (const [key, value] of Object.entries(filterOptions.fakerOverrides)) {
    fakerOverrides.set(normalizeFilterKey(key), toFakerOverrideSpec(value, key));
  }

  const uniqueTargets = dedupeTargets(targets);
  const filterResult = applyTargetFilters(uniqueTargets, {
    include: mergeFilters(filterOptions.include, inFileInclude),
    exclude: mergeFilters(filterOptions.exclude, inFileExclude),
  });
  warnings.push(...collectUnmatchedFilterWarnings(filterResult));

  const watchedFiles = program
    .getSourceFiles()
    .map((file) => path.resolve(file.fileName))
    .filter((fileName) => !fileName.includes("/node_modules/") && !fileName.endsWith(".d.ts"));

  return {
    sourceFile,
    checker,
    targets: filterResult.targets,
    warnings,
    watchedFiles,
    fakerOverrides,
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
        if (isIgnoredSymbol(resolvedSymbol)) {
          warnings.push(`Skipped imported type \"${element.name.text}\": marked with @gen-gen-ignore.`);
          continue;
        }

        const resolvedType = checker.getDeclaredTypeOfSymbol(resolvedSymbol);
        if (!isGeneratableRootType(resolvedType, checker)) {
          warnings.push(`Skipped imported type \"${element.name.text}\": only object types are supported for generators.`);
          continue;
        }

        targets.push({
          functionName: `generate${element.name.text}`,
          typeText: element.name.text,
          type: resolvedType,
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

function collectTupleTypeEntries(sourceFile: ts.SourceFile, aliasName: string): string[] {
  for (const statement of sourceFile.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) {
      continue;
    }

    if (statement.name.text !== aliasName) {
      continue;
    }

    if (!ts.isTupleTypeNode(statement.type)) {
      return [];
    }

    return statement.type.elements.map((element) => element.getText(sourceFile));
  }

  return [];
}

function collectFakerOverrides(sourceFile: ts.SourceFile, warnings: string[]): Record<string, FakerOverrideSpec> {
  const overrides: Record<string, FakerOverrideSpec> = {};

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "FakerOverrides") {
        continue;
      }

      const objectLiteral = declaration.initializer
        ? unwrapObjectLiteralExpression(declaration.initializer)
        : undefined;
      if (!objectLiteral) {
        warnings.push("Ignored FakerOverrides: expected an object literal.");
        continue;
      }

      for (const property of objectLiteral.properties) {
        if (!ts.isPropertyAssignment(property)) {
          continue;
        }

        const key = getObjectPropertyName(property.name);
        if (!key) {
          warnings.push("Ignored FakerOverrides property: only identifier and string-literal keys are supported.");
          continue;
        }

        const initializer = property.initializer;
        const isFunctionOverride = ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer);
        const invokeMode = isFunctionOverride
          ? initializer.parameters.length > 0
            ? "callWithFaker"
            : "call"
          : "raw";
        overrides[key] = {
          sourceKey: key,
          expression: initializer.getText(sourceFile),
          invokeMode,
        };
      }
    }
  }

  return overrides;
}

function unwrapObjectLiteralExpression(expression: ts.Expression): ts.ObjectLiteralExpression | undefined {
  if (ts.isObjectLiteralExpression(expression)) {
    return expression;
  }

  if (ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression) || ts.isParenthesizedExpression(expression)) {
    return unwrapObjectLiteralExpression(expression.expression);
  }

  return undefined;
}

function getObjectPropertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
    return name.text;
  }

  return null;
}

function toFakerOverrideSpec(input: FakerOverrideInput, sourceKey = ""): FakerOverrideSpec {
  if (typeof input === "function") {
    return {
      sourceKey,
      expression: input.toString(),
      invokeMode: input.length > 0 ? "callWithFaker" : "call",
    };
  }

  return {
    sourceKey,
    expression: input,
    invokeMode: "raw",
  };
}

function mergeFilters(...groups: string[][]): string[] {
  const merged = new Set<string>();
  for (const group of groups) {
    for (const value of group) {
      merged.add(value);
    }
  }
  return [...merged];
}

function applyTargetFilters(
  targets: TargetSpec[],
  filters: {
    include: string[];
    exclude: string[];
  },
): {
  targets: TargetSpec[];
  include: Map<string, string>;
  exclude: Map<string, string>;
  matchedInclude: Set<string>;
  matchedExclude: Set<string>;
} {
  const includeSet = normalizeFilterInput(filters.include);
  const excludeSet = normalizeFilterInput(filters.exclude);
  const matchedInclude = new Set<string>();
  const matchedExclude = new Set<string>();

  const filteredTargets = targets.filter((target) => {
    const keys = getTargetFilterKeys(target);
    for (const key of keys) {
      if (includeSet.has(key)) {
        matchedInclude.add(key);
      }
      if (excludeSet.has(key)) {
        matchedExclude.add(key);
      }
    }

    if (includeSet.size > 0 && !keys.some((key) => includeSet.has(key))) {
      return false;
    }

    if (keys.some((key) => excludeSet.has(key))) {
      return false;
    }

    return true;
  });

  return {
    targets: filteredTargets,
    include: includeSet,
    exclude: excludeSet,
    matchedInclude,
    matchedExclude,
  };
}

function normalizeFilterInput(values: string[]): Map<string, string> {
  const normalized = new Map<string, string>();
  for (const value of values) {
    const key = normalizeFilterKey(value);
    if (key.length === 0 || normalized.has(key)) {
      continue;
    }
    normalized.set(key, value);
  }
  return normalized;
}

function getTargetFilterKeys(target: TargetSpec): string[] {
  const keys = new Set<string>();
  keys.add(normalizeFilterKey(target.typeText));
  keys.add(normalizeFilterKey(target.functionName));
  if (target.functionName.startsWith("generate")) {
    keys.add(normalizeFilterKey(target.functionName.slice("generate".length)));
  }
  return [...keys];
}

function normalizeFilterKey(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
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

function isGeneratableRootType(type: ts.Type, checker: ts.TypeChecker): boolean {
  if ((type.flags & ts.TypeFlags.Union) !== 0) {
    const union = type as ts.UnionType;
    const concrete = union.types.filter(
      (member) => (member.flags & ts.TypeFlags.Null) === 0 && (member.flags & ts.TypeFlags.Undefined) === 0,
    );
    return concrete.length > 0 && concrete.every((member) => isGeneratableRootType(member, checker));
  }

  if ((type.flags & ts.TypeFlags.Intersection) !== 0) {
    const intersection = type as ts.IntersectionType;
    return intersection.types.every((member) => isGeneratableRootType(member, checker));
  }

  if ((type.flags & ts.TypeFlags.Object) === 0) {
    return false;
  }

  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    return false;
  }

  return true;
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

function emitFunctions(
  targets: TargetSpec[],
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  deepMerge: boolean,
  fakerOverrides: Map<string, FakerOverrideSpec>,
  policy: PropertyPolicy,
): {
  content: string;
  usedFakerOverrideKeys: Set<string>;
  warnings: string[];
} {
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
    fakerOverrides,
    usedFakerOverrideKeys: new Set<string>(),
    policy,
    emittedWarnings: new Set<string>(),
  };

  const sections: string[] = [emitSharedHelperRuntime(deepMerge)];
  sections.push(...targets.map((target) => emitFunction(target, context)));
  return {
    content: sections.join("\n\n"),
    usedFakerOverrideKeys: context.usedFakerOverrideKeys,
    warnings: [...context.emittedWarnings],
  };
}

function emitFunction(target: TargetSpec, context: GenerationContext): string {
  const callbackTypeName = `${toPascalCase(target.functionName)}CallbackParam`;
  const body = emitObjectLiteral(target.type, context, 1, target.typeText, target.typeText, []);
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
  rootTypeText: string,
  propertyPath: string[],
): string {
  const checker = context.checker;
  maybeWarnOnIndexSignature(type, context, rootTypeText, propertyPath);
  const properties = checker.getPropertiesOfType(type);

  const lines: string[] = ["{"];

  for (const property of properties) {
    if (context.policy.optionalProperties === "omit" && isOptionalProperty(property)) {
      continue;
    }

    if (context.policy.readonlyProperties === "warn" && isReadonlyProperty(property)) {
      const location = formatWarningLocation(rootTypeText, propertyPath, property.name);
      context.emittedWarnings.add(`Readonly property included by policy at ${location}.`);
    }

    const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? context.sourceFile;
    if (hasGenGenIgnoreTag(declaration, context.sourceFile)) {
      const propertyName = needsQuotedProperty(property.name) ? JSON.stringify(property.name) : property.name;
      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
      lines.push(formatObjectPropertyLine(propertyName, emitIgnoredExpression(propertyType, context)));
      continue;
    }

    const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
    const nextPath = [...propertyPath, property.name];
    const declaredTypeText = getDeclaredTypeText(declaration, context.sourceFile);
    const expression = emitExpression(
      propertyType,
      context,
      depth + 1,
      fallbackTypeText,
      rootTypeText,
      nextPath,
      declaredTypeText,
    );
    const propertyName = needsQuotedProperty(property.name) ? JSON.stringify(property.name) : property.name;
    lines.push(formatObjectPropertyLine(propertyName, expression));
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

function emitExpression(
  type: ts.Type,
  context: GenerationContext,
  depth: number,
  fallbackTypeText: string,
  rootTypeText: string,
  propertyPath: string[],
  declaredTypeText?: string,
): string {
  const checker = context.checker;
  const normalizedTypeText = checker.typeToString(type, context.sourceFile, ts.TypeFormatFlags.NoTruncation);

  const override = resolveFakerOverride(context, {
    rootTypeText,
    propertyPath,
    typeText: normalizedTypeText,
    aliasTypeText: type.aliasSymbol?.getName(),
    declaredTypeText,
  });
  if (override) {
    if (override.invokeMode === "callWithFaker") {
      return `(${override.expression})(faker)`;
    }
    if (override.invokeMode === "call") {
      return `(${override.expression})()`;
    }
    return override.expression;
  }

  const brandedPrimitiveKind = getBrandedPrimitiveKind(type);
  if (brandedPrimitiveKind) {
    const primitiveExpression = emitPrimitiveExpression(brandedPrimitiveKind);
    return normalizedTypeText === brandedPrimitiveKind ? primitiveExpression : `${primitiveExpression} as ${normalizedTypeText}`;
  }

  const enumValues = getEnumLiteralExpressions(type, context);
  if (enumValues.length > 0) {
    if (enumValues.length === 1) {
      return `${enumValues[0]} as ${normalizedTypeText}`;
    }
    return `faker.helpers.arrayElement([${enumValues.join(", ")}]) as ${normalizedTypeText}`;
  }

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
    return emitPrimitiveExpression("string");
  }

  if (type.flags & ts.TypeFlags.Number) {
    return emitPrimitiveExpression("number");
  }

  if (type.flags & ts.TypeFlags.Boolean) {
    return emitPrimitiveExpression("boolean");
  }

  if (type.flags & ts.TypeFlags.BigInt) {
    return emitPrimitiveExpression("bigint");
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
      const whenPresent = emitExpression(
        presentType,
        context,
        depth + 1,
        fallbackTypeText,
        rootTypeText,
        propertyPath,
        declaredTypeText,
      );
      return `faker.datatype.boolean() ? ${whenPresent} : null`;
    }

    if (concreteMembers.length === 1 && undefinedType) {
      const presentType = concreteMembers[0];
      if (!presentType) {
        return "undefined";
      }
      const whenPresent = emitExpression(
        presentType,
        context,
        depth + 1,
        fallbackTypeText,
        rootTypeText,
        propertyPath,
        declaredTypeText,
      );
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
        const branches = concreteMembers.map((member) =>
          emitExpression(member, context, depth + 1, fallbackTypeText, rootTypeText, propertyPath, declaredTypeText),
        );
        return `faker.helpers.arrayElement([${branches.join(", ")}])`;
      }

      const firstMember = concreteMembers[0];
      if (!firstMember) {
        return "undefined";
      }
      return emitExpression(firstMember, context, depth + 1, fallbackTypeText, rootTypeText, propertyPath, declaredTypeText);
    }

    return "undefined";
  }

  if (normalizedTypeText === "string") {
    return emitPrimitiveExpression("string");
  }
  if (normalizedTypeText === "number") {
    return emitPrimitiveExpression("number");
  }
  if (normalizedTypeText === "boolean") {
    return emitPrimitiveExpression("boolean");
  }
  if (normalizedTypeText === "bigint") {
    return emitPrimitiveExpression("bigint");
  }

  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    const ref = type as ts.TypeReference;
    const [itemType] = checker.getTypeArguments(ref);
    const itemExpression = itemType
      ? emitExpression(
          itemType,
          context,
          depth + 1,
          checker.typeToString(itemType, context.sourceFile, ts.TypeFormatFlags.NoTruncation),
          rootTypeText,
          propertyPath,
          declaredTypeText,
        )
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
    const nested = emitInlineObject(type, context, depth + 1, typeText, rootTypeText, propertyPath);
    context.activeTypes.delete(typeText);
    return nested;
  }

  return `{} as ${typeText}`;
}

function emitPrimitiveExpression(kind: "string" | "number" | "boolean" | "bigint"): string {
  if (kind === "string") {
    return "faker.word.noun()";
  }
  if (kind === "number") {
    return "faker.number.int({ min: 1, max: 1000 })";
  }
  if (kind === "boolean") {
    return "faker.datatype.boolean()";
  }
  return "BigInt(faker.number.int({ min: 1, max: 1000 }))";
}

function getBrandedPrimitiveKind(type: ts.Type): "string" | "number" | "boolean" | "bigint" | null {
  if ((type.flags & ts.TypeFlags.Intersection) === 0) {
    return null;
  }

  const intersection = type as ts.IntersectionType;
  let primitiveKind: "string" | "number" | "boolean" | "bigint" | null = null;

  for (const member of intersection.types) {
    const memberPrimitive = getPrimitiveKind(member);
    if (memberPrimitive) {
      if (primitiveKind && primitiveKind !== memberPrimitive) {
        return null;
      }
      primitiveKind = memberPrimitive;
      continue;
    }

    const isBrandLikeObject =
      (member.flags & ts.TypeFlags.Object) !== 0 ||
      (member.flags & ts.TypeFlags.Any) !== 0 ||
      (member.flags & ts.TypeFlags.Unknown) !== 0;
    if (!isBrandLikeObject) {
      return null;
    }
  }

  return primitiveKind;
}

function getPrimitiveKind(type: ts.Type): "string" | "number" | "boolean" | "bigint" | null {
  if ((type.flags & ts.TypeFlags.String) !== 0 || type.isStringLiteral()) {
    return "string";
  }
  if ((type.flags & ts.TypeFlags.Number) !== 0 || type.isNumberLiteral()) {
    return "number";
  }
  if ((type.flags & ts.TypeFlags.Boolean) !== 0 || (type.flags & ts.TypeFlags.BooleanLiteral) !== 0) {
    return "boolean";
  }
  if ((type.flags & ts.TypeFlags.BigInt) !== 0) {
    return "bigint";
  }
  return null;
}

function getEnumLiteralExpressions(type: ts.Type, context: GenerationContext): string[] {
  const declaration = getEnumDeclaration(type);
  if (!declaration) {
    return [];
  }

  const expressions: string[] = [];
  let nextNumeric = 0;
  for (const member of declaration.members) {
    const value = getEnumMemberValue(member, context.checker, nextNumeric);
    if (typeof value === "number") {
      expressions.push(String(value));
      nextNumeric = value + 1;
      continue;
    }
    if (typeof value === "string") {
      expressions.push(JSON.stringify(value));
      continue;
    }
  }

  return [...new Set(expressions)];
}

function getEnumDeclaration(type: ts.Type): ts.EnumDeclaration | undefined {
  const symbols = [type.aliasSymbol, type.getSymbol()].filter((symbol): symbol is ts.Symbol => !!symbol);

  for (const symbol of symbols) {
    for (const declaration of symbol.declarations ?? []) {
      if (ts.isEnumDeclaration(declaration)) {
        return declaration;
      }
      if (ts.isEnumMember(declaration) && ts.isEnumDeclaration(declaration.parent)) {
        return declaration.parent;
      }
    }
  }

  if ((type.flags & ts.TypeFlags.Union) !== 0) {
    const union = type as ts.UnionType;
    for (const member of union.types) {
      const declaration = getEnumDeclaration(member);
      if (declaration) {
        return declaration;
      }
    }
  }

  return undefined;
}

function getEnumMemberValue(
  member: ts.EnumMember,
  checker: ts.TypeChecker,
  nextNumeric: number,
): string | number | undefined {
  const constantValue = checker.getConstantValue(member);
  if (typeof constantValue === "string" || typeof constantValue === "number") {
    return constantValue;
  }

  if (!member.initializer) {
    return nextNumeric;
  }

  if (ts.isStringLiteral(member.initializer) || ts.isNoSubstitutionTemplateLiteral(member.initializer)) {
    return member.initializer.text;
  }

  if (ts.isNumericLiteral(member.initializer)) {
    return Number(member.initializer.text);
  }

  if (ts.isPrefixUnaryExpression(member.initializer) && ts.isNumericLiteral(member.initializer.operand)) {
    const value = Number(member.initializer.operand.text);
    if (member.initializer.operator === ts.SyntaxKind.MinusToken) {
      return -value;
    }
    if (member.initializer.operator === ts.SyntaxKind.PlusToken) {
      return value;
    }
  }

  return undefined;
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

function emitInlineObject(
  type: ts.Type,
  context: GenerationContext,
  depth: number,
  typeText: string,
  rootTypeText: string,
  propertyPath: string[],
): string {
  const checker = context.checker;
  maybeWarnOnIndexSignature(type, context, rootTypeText, propertyPath);
  const properties = checker.getPropertiesOfType(type);
  if (properties.length === 0) {
    return `{} as ${typeText}`;
  }

  const lines: string[] = ["{"];

  for (const property of properties) {
    if (context.policy.optionalProperties === "omit" && isOptionalProperty(property)) {
      continue;
    }

    if (context.policy.readonlyProperties === "warn" && isReadonlyProperty(property)) {
      const location = formatWarningLocation(rootTypeText, propertyPath, property.name);
      context.emittedWarnings.add(`Readonly property included by policy at ${location}.`);
    }

    const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? context.sourceFile;
    if (hasGenGenIgnoreTag(declaration, context.sourceFile)) {
      const propertyName = needsQuotedProperty(property.name) ? JSON.stringify(property.name) : property.name;
      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
      lines.push(formatObjectPropertyLine(propertyName, emitIgnoredExpression(propertyType, context)));
      continue;
    }

    const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
    const expression = emitExpression(
      propertyType,
      context,
      depth + 1,
      checker.typeToString(propertyType),
      rootTypeText,
      [...propertyPath, property.name],
      getDeclaredTypeText(declaration, context.sourceFile),
    );
    const propertyName = needsQuotedProperty(property.name) ? JSON.stringify(property.name) : property.name;
    lines.push(formatObjectPropertyLine(propertyName, expression));
  }

  lines.push("}");
  return lines.join("\n");
}

function resolveFakerOverride(
  context: GenerationContext,
  value: {
    rootTypeText: string;
    propertyPath: string[];
    typeText: string;
    aliasTypeText?: string;
    declaredTypeText?: string;
  },
): FakerOverrideSpec | undefined {
  const path = value.propertyPath.join(".");
  const keys = [
    normalizeFilterKey(`${value.rootTypeText}.${path}`),
    normalizeFilterKey(path),
    normalizeFilterKey(value.propertyPath[value.propertyPath.length - 1] ?? ""),
    normalizeFilterKey(value.declaredTypeText ?? ""),
    normalizeFilterKey(value.aliasTypeText ?? ""),
    normalizeFilterKey(value.typeText),
  ].filter((key) => key.length > 0);

  for (const key of keys) {
    const override = context.fakerOverrides.get(key);
    if (override) {
      context.usedFakerOverrideKeys.add(key);
      return override;
    }
  }

  return undefined;
}

function collectUnmatchedFilterWarnings(filterResult: {
  include: Map<string, string>;
  exclude: Map<string, string>;
  matchedInclude: Set<string>;
  matchedExclude: Set<string>;
}): string[] {
  const warnings: string[] = [];
  const unmatchedInclude = [...filterResult.include.entries()]
    .filter(([key]) => !filterResult.matchedInclude.has(key))
    .map(([, original]) => original);
  const unmatchedExclude = [...filterResult.exclude.entries()]
    .filter(([key]) => !filterResult.matchedExclude.has(key))
    .map(([, original]) => original);

  if (unmatchedInclude.length > 0) {
    warnings.push(`Unmatched include filters: ${unmatchedInclude.join(", ")}`);
  }

  if (unmatchedExclude.length > 0) {
    warnings.push(`Unmatched exclude filters: ${unmatchedExclude.join(", ")}`);
  }

  return warnings;
}

function collectUnusedFakerOverrideWarnings(
  overrides: Map<string, FakerOverrideSpec>,
  usedOverrideKeys: Set<string>,
): string[] {
  const unused = [...overrides.entries()]
    .filter(([key]) => !usedOverrideKeys.has(key))
    .map(([, spec]) => spec.sourceKey);
  if (unused.length === 0) {
    return [];
  }

  return [`Unused faker overrides: ${unused.join(", ")}`];
}

function getDeclaredTypeText(declaration: ts.Node, sourceFile: ts.SourceFile): string | undefined {
  if (
    ts.isPropertySignature(declaration) ||
    ts.isPropertyDeclaration(declaration) ||
    ts.isParameter(declaration) ||
    ts.isTypeAliasDeclaration(declaration)
  ) {
    return declaration.type?.getText(sourceFile);
  }

  return undefined;
}

function emitIgnoredExpression(type: ts.Type, context: GenerationContext): string {
  const checker = context.checker;
  const typeText = checker.typeToString(type, context.sourceFile, ts.TypeFormatFlags.NoTruncation);
  if (
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    !checker.isArrayType(type) &&
    !checker.isTupleType(type) &&
    !isDateType(type)
  ) {
    return `{} as ${typeText}`;
  }

  return `undefined as unknown as ${typeText}`;
}

function isIgnoredType(type: ts.Type): boolean {
  if (type.aliasSymbol && isIgnoredSymbol(type.aliasSymbol)) {
    return true;
  }

  const symbol = type.getSymbol();
  if (symbol && isIgnoredSymbol(symbol)) {
    return true;
  }

  return false;
}

function isIgnoredSymbol(symbol: ts.Symbol): boolean {
  return (symbol.declarations ?? []).some((declaration) => hasGenGenIgnoreTag(declaration));
}

function hasGenGenIgnoreTag(node: ts.Node, sourceFile?: ts.SourceFile): boolean {
  if (ts.getJSDocTags(node).some((tag) => tag.tagName.text === "gen-gen-ignore")) {
    return true;
  }

  const file = sourceFile ?? node.getSourceFile();
  const fullText = file.getFullText();
  const leading = ts.getLeadingCommentRanges(fullText, node.getFullStart()) ?? [];
  return leading.some((range) => fullText.slice(range.pos, range.end).includes("@gen-gen-ignore"));
}

function isOptionalProperty(symbol: ts.Symbol): boolean {
  return (symbol.flags & ts.SymbolFlags.Optional) !== 0;
}

function isReadonlyProperty(symbol: ts.Symbol): boolean {
  return (symbol.declarations ?? []).some((declaration) => {
    if (
      ts.isPropertySignature(declaration) ||
      ts.isPropertyDeclaration(declaration) ||
      ts.isParameter(declaration)
    ) {
      return (declaration.modifiers ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword);
    }
    return false;
  });
}

function maybeWarnOnIndexSignature(
  type: ts.Type,
  context: GenerationContext,
  rootTypeText: string,
  propertyPath: string[],
): void {
  if (context.policy.indexSignatures !== "warn") {
    return;
  }

  const checker = context.checker;
  const hasStringIndex = checker.getIndexTypeOfType(type, ts.IndexKind.String) !== undefined;
  const hasNumberIndex = checker.getIndexTypeOfType(type, ts.IndexKind.Number) !== undefined;
  if (!hasStringIndex && !hasNumberIndex) {
    return;
  }

  const kind = hasStringIndex && hasNumberIndex ? "string/number" : hasStringIndex ? "string" : "number";
  const location = formatWarningLocation(rootTypeText, propertyPath);
  context.emittedWarnings.add(`Index signature (${kind}) not materialized at ${location}.`);
}

function formatWarningLocation(rootTypeText: string, propertyPath: string[], leaf?: string): string {
  const parts = [...propertyPath];
  if (leaf) {
    parts.push(leaf);
  }

  if (parts.length === 0) {
    return rootTypeText;
  }
  return `${rootTypeText}.${parts.join(".")}`;
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

function formatObjectPropertyLine(name: string, expression: string): string {
  const lines = expression.split("\n");
  if (lines.length <= 1) {
    return `  ${name}: ${expression},`;
  }

  const [firstLine, ...rest] = lines;
  const output = [`  ${name}: ${firstLine}`];
  for (const line of rest) {
    output.push(`  ${line}`);
  }

  const last = output[output.length - 1];
  output[output.length - 1] = `${last},`;
  return output.join("\n");
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
