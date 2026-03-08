import ts from "typescript";

type TypeMap = Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>;

type GenerateResult = {
  code: string;
  errors: string[];
};

const NULLISH_KINDS = new Set([ts.SyntaxKind.NullKeyword, ts.SyntaxKind.UndefinedKeyword, ts.SyntaxKind.VoidKeyword]);

export function generateFactoryFromSource(source: string): GenerateResult {
  const sourceFile = ts.createSourceFile("playground.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const parseDiagnostics = (sourceFile as ts.SourceFile & {parseDiagnostics?: readonly ts.DiagnosticWithLocation[]})
    .parseDiagnostics ?? [];
  const errors = parseDiagnostics.map((diagnostic) => formatDiagnostic(sourceFile, diagnostic));

  if (errors.length > 0) {
    return {code: "", errors};
  }

  const typeMap: TypeMap = new Map();

  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      typeMap.set(statement.name.text, statement);
    }
  }

  if (typeMap.size === 0) {
    return {
      code: "",
      errors: ["No interface or type alias found. Add a type like `interface User { id: string }` and try again."],
    };
  }

  const [rootName] = [...typeMap.keys()];
  const rootDeclaration = typeMap.get(rootName);

  if (!rootDeclaration) {
    return {code: "", errors: ["Unable to resolve root type declaration."]};
  }

  const visited = new Set<string>();
  const rootTypeNode = ts.isInterfaceDeclaration(rootDeclaration) ? undefined : rootDeclaration.type;
  const renderedObject = renderObjectExpression(rootTypeNode, rootDeclaration, typeMap, visited, errors, sourceFile);

  if (errors.length > 0) {
    return {code: "", errors};
  }

  return {
    code: [
      `// Generated from type: ${rootName}`,
      `export const make${rootName} = (overrides: Partial<${rootName}> = {}): ${rootName} => ({`,
      indent(renderedObject),
      "  ...overrides,",
      "});",
    ].join("\n"),
    errors: [],
  };
}

function renderObjectExpression(
  inlineTypeNode: ts.TypeNode | undefined,
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  typeMap: TypeMap,
  visited: Set<string>,
  errors: string[],
  sourceFile: ts.SourceFile,
): string {
  const propertyLines: string[] = [];
  const members = getMembers(inlineTypeNode, declaration, typeMap, visited, errors, sourceFile);

  for (const member of members) {
    if (!ts.isPropertySignature(member)) {
      continue;
    }

    if (!member.name || !ts.isIdentifier(member.name)) {
      errors.push(`Only identifier property names are supported (line ${lineOf(sourceFile, member)}).`);
      continue;
    }

    const key = member.name.text;
    const value = renderTypeNode(member.type, typeMap, visited, errors, sourceFile);

    if (!value) {
      errors.push(`Could not generate a value for property \`${key}\` (line ${lineOf(sourceFile, member)}).`);
      continue;
    }

    propertyLines.push(`  ${key}: ${value},`);
  }

  return propertyLines.length > 0 ? propertyLines.join("\n") : "  // No properties found";
}

function getMembers(
  inlineTypeNode: ts.TypeNode | undefined,
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  typeMap: TypeMap,
  visited: Set<string>,
  errors: string[],
  sourceFile: ts.SourceFile,
): ts.TypeElement[] {
  if (inlineTypeNode) {
    if (ts.isTypeLiteralNode(inlineTypeNode)) {
      return [...inlineTypeNode.members];
    }

    if (ts.isIntersectionTypeNode(inlineTypeNode)) {
      const members: ts.TypeElement[] = [];
      for (const typeNode of inlineTypeNode.types) {
        members.push(...getMembers(typeNode, declaration, typeMap, visited, errors, sourceFile));
      }
      return members;
    }

    if (ts.isTypeReferenceNode(inlineTypeNode) && ts.isIdentifier(inlineTypeNode.typeName)) {
      const refName = inlineTypeNode.typeName.text;
      const refDecl = typeMap.get(refName);

      if (!refDecl) {
        errors.push(`Unknown referenced type \`${refName}\` (line ${lineOf(sourceFile, inlineTypeNode)}).`);
        return [];
      }

      if (visited.has(refName)) {
        errors.push(`Circular type reference detected for \`${refName}\`.`);
        return [];
      }

      visited.add(refName);
      const members = getMembers(
        ts.isTypeAliasDeclaration(refDecl) ? refDecl.type : undefined,
        refDecl,
        typeMap,
        visited,
        errors,
        sourceFile,
      );
      visited.delete(refName);
      return members;
    }

    errors.push(`Unsupported top-level type syntax: \`${inlineTypeNode.getText(sourceFile)}\`.`);
    return [];
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    const members = [...declaration.members];

    for (const heritageClause of declaration.heritageClauses ?? []) {
      for (const heritageType of heritageClause.types) {
        if (!ts.isIdentifier(heritageType.expression)) {
          continue;
        }

        const refName = heritageType.expression.text;
        const refDecl = typeMap.get(refName);

        if (!refDecl) {
          errors.push(`Unknown extended interface \`${refName}\` (line ${lineOf(sourceFile, heritageType)}).`);
          continue;
        }

        members.push(...getMembers(ts.isTypeAliasDeclaration(refDecl) ? refDecl.type : undefined, refDecl, typeMap, visited, errors, sourceFile));
      }
    }

    return members;
  }

  return getMembers(declaration.type, declaration, typeMap, visited, errors, sourceFile);
}

function renderTypeNode(
  typeNode: ts.TypeNode | undefined,
  typeMap: TypeMap,
  visited: Set<string>,
  errors: string[],
  sourceFile: ts.SourceFile,
): string | null {
  if (!typeNode) {
    return "null";
  }

  if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
    return "\"example\"";
  }

  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
    return "123";
  }

  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
    return "true";
  }

  if (typeNode.kind === ts.SyntaxKind.BigIntKeyword) {
    return "123n";
  }

  if (typeNode.kind === ts.SyntaxKind.NullKeyword) {
    return "null";
  }

  if (typeNode.kind === ts.SyntaxKind.AnyKeyword || typeNode.kind === ts.SyntaxKind.UnknownKeyword) {
    return "{}";
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    return typeNode.literal.getText(sourceFile);
  }

  if (ts.isArrayTypeNode(typeNode)) {
    const value = renderTypeNode(typeNode.elementType, typeMap, visited, errors, sourceFile);
    return value ? `[${value}]` : null;
  }

  if (ts.isTupleTypeNode(typeNode)) {
    const elements = typeNode.elements
      .map((element) => renderTypeNode(stripNamedTuple(element), typeMap, visited, errors, sourceFile))
      .filter((element): element is string => Boolean(element));
    return `[${elements.join(", ")}]`;
  }

  if (ts.isUnionTypeNode(typeNode)) {
    const pick = typeNode.types.find((candidate) => !NULLISH_KINDS.has(candidate.kind)) ?? typeNode.types[0];
    return renderTypeNode(pick, typeMap, visited, errors, sourceFile);
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    return renderTypeNode(typeNode.type, typeMap, visited, errors, sourceFile);
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    const props: string[] = [];
    for (const member of typeNode.members) {
      if (!ts.isPropertySignature(member) || !member.name || !ts.isIdentifier(member.name)) {
        continue;
      }

      const value = renderTypeNode(member.type, typeMap, visited, errors, sourceFile) ?? "null";
      props.push(`${member.name.text}: ${value}`);
    }

    return `{ ${props.join(", ")} }`;
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    if (!ts.isIdentifier(typeNode.typeName)) {
      return "null";
    }

    const refName = typeNode.typeName.text;

    if (refName === "Date") {
      return "new Date()";
    }

    if (refName === "Record") {
      return "{}";
    }

    if (refName === "Array" && typeNode.typeArguments?.[0]) {
      const value = renderTypeNode(typeNode.typeArguments[0], typeMap, visited, errors, sourceFile) ?? "null";
      return `[${value}]`;
    }

    const refDecl = typeMap.get(refName);
    if (!refDecl) {
      errors.push(`Unknown referenced type \`${refName}\` (line ${lineOf(sourceFile, typeNode)}).`);
      return null;
    }

    if (visited.has(refName)) {
      errors.push(`Circular type reference detected for \`${refName}\`.`);
      return null;
    }

    visited.add(refName);
    const objectExpr = renderObjectExpression(
      ts.isTypeAliasDeclaration(refDecl) ? refDecl.type : undefined,
      refDecl,
      typeMap,
      visited,
      errors,
      sourceFile,
    );
    visited.delete(refName);

    return `{\n${objectExpr}\n}`;
  }

  errors.push(`Unsupported type syntax: \`${typeNode.getText(sourceFile)}\` (line ${lineOf(sourceFile, typeNode)}).`);
  return null;
}

function stripNamedTuple(typeNode: ts.TypeNode): ts.TypeNode {
  if (ts.isNamedTupleMember(typeNode)) {
    return typeNode.type;
  }

  return typeNode;
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

function formatDiagnostic(sourceFile: ts.SourceFile, diagnostic: ts.DiagnosticWithLocation): string {
  const {line, character} = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  return `Line ${line + 1}, column ${character + 1}: ${message}`;
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}
