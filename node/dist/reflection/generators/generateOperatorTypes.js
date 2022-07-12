"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOperators = exports.generateOperatorFunctions = void 0;
const builders_1 = require("../builders");
const genutil_1 = require("../util/genutil");
const generateFunctionTypes_1 = require("./generateFunctionTypes");
const functionUtils_1 = require("../util/functionUtils");
const __1 = require("..");
const generateObjectTypes_1 = require("./generateObjectTypes");
function generateOperatorFunctions({ dir, operators, types, casts, isDeno }) {
    (0, generateFunctionTypes_1.generateFuncopTypes)(dir, types, casts, operators, "Operator", "OpExpr", false, (code, opDef, args, namedArgs, returnType) => {
        code.writeln([(0, builders_1.t) `${(0, genutil_1.quote)(opDef.originalName)},`]);
        code.writeln([(0, builders_1.t) `$.OperatorKind.${opDef.operator_kind},`]);
        code.writeln([(0, builders_1.t) `${args}`]);
        code.writeln([(0, builders_1.t) `${returnType}`]);
    }, (code, opName, opDefs) => {
        code.writeln([(0, builders_1.r) `__name__: ${(0, genutil_1.quote)(opDefs[0].originalName)},`]);
        code.writeln([(0, builders_1.r) `__opkind__: kind,`]);
        code.writeln([(0, builders_1.r) `__args__: positionalArgs,`]);
    }, isDeno);
}
exports.generateOperatorFunctions = generateOperatorFunctions;
const skipOperators = new Set([
    "std::index",
    "std::slice",
    "std::destructure",
]);
function generateOperators({ dir, operators, types, casts, isDeno }) {
    const typeSpecificities = (0, functionUtils_1.getTypesSpecificity)(types, casts);
    const implicitCastableRootTypes = (0, functionUtils_1.getImplicitCastableRootTypes)(casts);
    const code = dir.getPath("operators");
    const edgedb = isDeno ? "https://deno.land/x/edgedb/mod.ts" : "edgedb";
    code.addImport({ $: true }, edgedb);
    code.addImportStar("_", "./imports", { allowFileExt: true });
    const overloadsBuf = new builders_1.CodeBuffer();
    const overloadDefs = {};
    for (const opKind of Object.values(__1.OperatorKind)) {
        overloadDefs[opKind] = {};
    }
    for (const [opName, _opDefs] of operators.entries()) {
        if (skipOperators.has(opName))
            continue;
        const opDefs = (0, functionUtils_1.expandFuncopAnytypeOverloads)((0, functionUtils_1.sortFuncopOverloads)(_opDefs, typeSpecificities), types, casts, implicitCastableRootTypes);
        let overloadIndex = 0;
        for (const opDef of opDefs) {
            const { params } = opDef;
            const opSymbol = opName === "std::if_else"
                ? "if_else"
                : (0, genutil_1.splitName)(opDef.originalName).name.toLowerCase();
            if (opDef.overloadIndex === overloadIndex) {
                if (!overloadDefs[opDef.operator_kind][opSymbol]) {
                    overloadDefs[opDef.operator_kind][opSymbol] = [];
                }
                overloadDefs[opDef.operator_kind][opSymbol].push((0, generateFunctionTypes_1.generateFuncopDef)(opDef));
                overloadIndex++;
            }
            if (opDef.description) {
                overloadsBuf.writeln([
                    (0, builders_1.t) `/**
* ${opDef.description.replace(/\*\//g, "")}
*/`,
                ]);
            }
            overloadsBuf.writeln([(0, builders_1.dts) `declare `, (0, builders_1.t) `function op<`]);
            const anytypes = opDef.anytypes;
            const anytypeParams = [];
            function getParamAnytype(paramTypeName, paramType) {
                if (!anytypes)
                    return undefined;
                if (anytypes.kind === "castable") {
                    if (paramType.name.includes("anytype")) {
                        const path = (0, functionUtils_1.findPathOfAnytype)(paramType.id, types);
                        anytypeParams.push(`${paramTypeName}${path}`);
                    }
                    return anytypes.type;
                }
                else {
                    return anytypes.refName === paramTypeName
                        ? anytypes.type
                        : `$.getPrimitive${anytypes.type[0] === "$.NonArrayType" ? "NonArray" : ""}BaseType<${(0, generateFunctionTypes_1.allowsLiterals)(anytypes.typeObj, anytypes)
                            ? `_.castMaps.literalToTypeSet<${anytypes.refName}>`
                            : anytypes.refName}${anytypes.refPath}>`;
                }
            }
            let hasLiterals = false;
            overloadsBuf.indented(() => {
                for (const param of params.positional) {
                    const anytype = getParamAnytype(param.typeName, param.type);
                    const paramTypeStr = (0, generateObjectTypes_1.getStringRepresentation)(param.type, {
                        types,
                        anytype,
                        casts: casts.implicitCastFromMap,
                    });
                    let type = (0, genutil_1.frag) `$.TypeSet<${paramTypeStr.staticType}>`;
                    if ((0, generateFunctionTypes_1.allowsLiterals)(param.type, anytypes)) {
                        type = (0, genutil_1.frag) `_.castMaps.orScalarLiteral<${type}>`;
                        hasLiterals = true;
                    }
                    overloadsBuf.writeln([(0, builders_1.t) `${param.typeName} extends ${type},`]);
                }
            });
            overloadsBuf.writeln([(0, builders_1.t) `>(`]);
            overloadsBuf.indented(() => {
                const args = params.positional.map(param => `${param.internalName}: ${param.typeName}`);
                switch (opDef.operator_kind) {
                    case __1.OperatorKind.Infix:
                        overloadsBuf.writeln([
                            (0, builders_1.t) `${args[0]}, op: ${(0, genutil_1.quote)(opSymbol)}, ${args[1]}`,
                        ]);
                        break;
                    case __1.OperatorKind.Prefix:
                        overloadsBuf.writeln([(0, builders_1.t) `op: ${(0, genutil_1.quote)(opSymbol)}, ${args[0]}`]);
                        break;
                    case __1.OperatorKind.Postfix:
                        overloadsBuf.writeln([(0, builders_1.t) `${args[0]}, op: ${(0, genutil_1.quote)(opSymbol)}`]);
                        break;
                    case __1.OperatorKind.Ternary:
                        if (opName === "std::if_else") {
                            overloadsBuf.writeln([
                                (0, builders_1.t) `${args[0]}, op: "if", ${args[1]}, op2: "else", ${args[2]}`,
                            ]);
                        }
                        else {
                            throw new Error(`unknown ternary operator: ${opName}`);
                        }
                        break;
                    default:
                        throw new Error(`unknown operator kind: ${opDef.operator_kind}`);
                }
            });
            const paramTypeNames = params.positional
                .map(param => param.typeName)
                .join(", ");
            const returnAnytype = anytypes
                ? anytypes.kind === "castable"
                    ? anytypeParams.length <= 1
                        ? anytypeParams[0]
                        : anytypeParams.slice(1).reduce((parent, type) => {
                            return `${anytypes.returnAnytypeWrapper}<${parent}, ${type}>`;
                        }, anytypeParams[0])
                    : `$.getPrimitive${anytypes.type[0] === "$.NonArrayType" ? "NonArray" : ""}BaseType<${(0, generateFunctionTypes_1.allowsLiterals)(anytypes.typeObj, anytypes)
                        ? `_.castMaps.literalToTypeSet<${anytypes.refName}>`
                        : anytypes.refName}${anytypes.refPath}>`
                : undefined;
            const returnType = (0, generateObjectTypes_1.getStringRepresentation)(types.get(opDef.return_type.id), {
                types,
                anytype: returnAnytype,
            });
            overloadsBuf.writeln([(0, builders_1.t) `): $.$expr_Operator<`]);
            overloadsBuf.indented(() => {
                overloadsBuf.writeln([(0, builders_1.t) `${(0, genutil_1.quote)(opSymbol)},`]);
                overloadsBuf.writeln([(0, builders_1.t) `$.OperatorKind.${opDef.operator_kind},`]);
                overloadsBuf.writeln([
                    (0, builders_1.t) `${hasLiterals
                        ? `_.castMaps.mapLiteralToTypeSet<[${paramTypeNames}]>`
                        : `[${paramTypeNames}]`},`,
                ]);
                overloadsBuf.writeln([
                    (0, builders_1.t) `$.TypeSet<${returnType.staticType}, ${(0, generateFunctionTypes_1.generateReturnCardinality)(opName, params, opDef.return_typemod, false, anytypes)}>`,
                ]);
            });
            overloadsBuf.writeln([(0, builders_1.t) `>;`]);
        }
    }
    code.nl();
    code.writeln([
        (0, builders_1.r) `const overloadDefs`,
        (0, builders_1.ts) `: {
  [opKind in 'Infix' | 'Prefix' | 'Postfix' | 'Ternary']: {
    [opSymbol: string]: any[]
  }
}`,
        (0, builders_1.r) ` = {`,
    ]);
    code.indented(() => {
        for (const opKind of Object.keys(overloadDefs)) {
            code.writeln([(0, builders_1.r) `${opKind}: {`]);
            code.indented(() => {
                for (const symbol of Object.keys(overloadDefs[opKind])) {
                    code.writeln([(0, builders_1.r) `${(0, genutil_1.quote)(symbol)}: [`]);
                    code.indented(() => {
                        for (const overloadDef of overloadDefs[opKind][symbol]) {
                            code.writeln([(0, builders_1.r) `${overloadDef},`]);
                        }
                    });
                    code.writeln([(0, builders_1.r) `],`]);
                }
            });
            code.writeln([(0, builders_1.r) `},`]);
        }
    });
    code.writeln([(0, builders_1.r) `};`]);
    code.nl();
    code.writeBuf(overloadsBuf);
    code.writeln([(0, builders_1.r) `function op(...args`, (0, builders_1.ts) `: any[]`, (0, builders_1.r) `) {`]);
    code.indented(() => {
        code.writeln([
            (0, builders_1.r) `let op`,
            (0, builders_1.ts) `: string`,
            (0, builders_1.r) ` = "";
  let params`,
            (0, builders_1.ts) `: any[]`,
            (0, builders_1.r) ` = [];
  let defs`,
            (0, builders_1.ts) `: any[] | null`,
            (0, builders_1.r) ` = null;
  if (args.length === 2) {
    if (typeof args[0] === "string" && overloadDefs.Prefix[args[0]]) {
      op = args[0];
      params = [args[1]];
      defs = overloadDefs.Prefix[op];
    } else if (typeof args[1] === "string" && overloadDefs.Postfix[args[1]]) {
      op = args[1];
      params = [args[0]];
      defs = overloadDefs.Postfix[op];
    }
  } else if (args.length === 3) {
    if (typeof args[1] === "string") {
      op = args[1];
      params = [args[0], args[2]];
      defs = overloadDefs.Infix[op];
    }
  } else if (args.length === 5) {
    if (typeof args[1] === "string" && typeof args[3] === "string") {
      op = \`\${args[1]}_\${args[3]}\`;
      params = [args[0], args[2], args[4]];
      defs = overloadDefs.Ternary[op];
    }
  }

  if (!defs) {
    throw new Error(\`No operator exists with signature: \${args.map(arg => \`\${arg}\`).join(", ")}\`);
  }`,
        ]);
        code.nl();
        code.writeln([
            (0, builders_1.r) `const {kind, returnType, cardinality, args: resolvedArgs} = _.syntax.$resolveOverload(op, params, _.spec, defs);`,
        ]);
        code.nl();
        code.writeln([(0, builders_1.r) `return _.syntax.$expressionify({`]);
        code.indented(() => {
            code.writeln([(0, builders_1.r) `__kind__: $.ExpressionKind.Operator,`]);
            code.writeln([(0, builders_1.r) `__element__: returnType,`]);
            code.writeln([(0, builders_1.r) `__cardinality__: cardinality,`]);
            code.writeln([(0, builders_1.r) `__name__: op,`]);
            code.writeln([(0, builders_1.r) `__opkind__: kind,`]);
            code.writeln([(0, builders_1.r) `__args__: resolvedArgs,`]);
        });
        code.writeln([(0, builders_1.r) `})`, (0, builders_1.ts) ` as any`, (0, builders_1.r) `;`]);
    });
    code.writeln([(0, builders_1.r) `};`]);
    code.addExport("op");
}
exports.generateOperators = generateOperators;
