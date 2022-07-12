"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSetImpl = void 0;
const builders_1 = require("../builders");
const functionUtils_1 = require("../util/functionUtils");
const generateObjectTypes_1 = require("./generateObjectTypes");
const generateSetImpl = ({ dir, types, casts, isDeno }) => {
    const code = dir.getPath("syntax/setImpl");
    const implicitCastableRootTypes = (0, functionUtils_1.getImplicitCastableRootTypes)(casts);
    const edgedb = isDeno ? "https://deno.land/x/edgedb/mod.ts" : "edgedb";
    code.addImport({
        $: true,
    }, edgedb, { allowFileExt: false });
    code.addImportStar("castMaps", "../castMaps", {
        allowFileExt: true,
        modes: ["ts", "js", "dts"],
    });
    code.addImport({ $expressionify: true }, "./path", {
        allowFileExt: true,
        modes: ["ts", "js"],
    });
    code.addImport({
        $expr_Set: true,
        mergeObjectTypesVariadic: true,
        getTypesFromExprs: true,
        getTypesFromObjectExprs: true,
        getCardsFromExprs: true,
        getSharedParentPrimitiveVariadic: true,
        LooseTypeSet: true,
    }, "./set", { allowFileExt: true, typeOnly: true });
    code.addImport({ getSharedParent: true }, "./set", {
        allowFileExt: true,
        modes: ["ts", "js"],
    });
    code.nl();
    code.writeln([
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type getSetTypeFromExprs<
  Exprs extends [$.TypeSet, ...$.TypeSet[]]
> = LooseTypeSet<
  getSharedParentPrimitiveVariadic<getTypesFromExprs<Exprs>>,
  $.cardinalityUtil.mergeCardinalitiesVariadic<getCardsFromExprs<Exprs>>
>;`,
    ]);
    code.nl();
    code.writeln([(0, builders_1.dts) `declare `, (0, builders_1.t) `function set(): null;`]);
    code.writeln([
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `function set<
  Expr extends castMaps.orScalarLiteral<$.TypeSet>
>(expr: Expr): $expr_Set<castMaps.literalToTypeSet<Expr>>;`,
    ]);
    for (const implicitRootTypeId of implicitCastableRootTypes) {
        code.writeln([
            (0, builders_1.dts) `declare `,
            (0, builders_1.t) `function set<
  Expr extends castMaps.orScalarLiteral<$.TypeSet<${(0, generateObjectTypes_1.getStringRepresentation)(types.get(implicitRootTypeId), {
                types,
                casts: casts.implicitCastFromMap,
            }).staticType}>>,
  Exprs extends [Expr, ...Expr[]]
>(...exprs: Exprs): $expr_Set<getSetTypeFromExprs<castMaps.mapLiteralToTypeSet<Exprs>>>;`,
        ]);
        code.writeln([
            (0, builders_1.dts) `declare `,
            (0, builders_1.t) `function set<
  Expr extends $.TypeSet<$.ArrayType<${(0, generateObjectTypes_1.getStringRepresentation)(types.get(implicitRootTypeId), {
                types,
                casts: casts.implicitCastFromMap,
            }).staticType}>>,
  Exprs extends [Expr, ...Expr[]]
>(...exprs: Exprs): $expr_Set<getSetTypeFromExprs<Exprs>>;`,
        ]);
    }
    code.writeln([
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `function set<
  Expr extends $.ObjectTypeSet,
  Exprs extends [Expr, ...Expr[]]
>(
  ...exprs: Exprs
): $expr_Set<
  LooseTypeSet<
    mergeObjectTypesVariadic<getTypesFromObjectExprs<Exprs>>,
    $.cardinalityUtil.mergeCardinalitiesVariadic<getCardsFromExprs<Exprs>>
  >
>;
`,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `function set<
  Expr extends $.TypeSet<$.AnyTupleType>,
  Exprs extends [Expr, ...Expr[]]
>(...exprs: Exprs): $expr_Set<getSetTypeFromExprs<Exprs>>;
`,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `function set<
  Expr extends $.TypeSet<$.BaseType> | castMaps.scalarLiterals,
  Exprs extends castMaps.orScalarLiteral<
    $.TypeSet<$.getPrimitiveBaseType<castMaps.literalToTypeSet<Expr>["__element__"]>>
  >[]
>(
  expr: Expr,
  ...exprs: Exprs
): $expr_Set<
  $.TypeSet<
    $.getPrimitiveBaseType<castMaps.literalToTypeSet<Expr>["__element__"]>,
    $.cardinalityUtil.mergeCardinalitiesVariadic<
      getCardsFromExprs<castMaps.mapLiteralToTypeSet<[Expr, ...Exprs]>>
    >
  >
>;
`,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `function set<Expr extends $.TypeSet<$.BaseType> | castMaps.scalarLiterals>(
  ...exprs: Expr[]
): $expr_Set<
  $.TypeSet<
    $.getPrimitiveBaseType<castMaps.literalToTypeSet<Expr>["__element__"]>,
    $.Cardinality.Many
  >
>;`,
    ]);
    code.writeln([
        (0, builders_1.r) `function set(..._exprs`,
        (0, builders_1.ts) `: any[]`,
        (0, builders_1.r) `) {
  // if no arg
  // if arg
  //   return empty set
  // if object set
  //   merged objects
  // if primitive
  //   return shared parent of scalars
  if(_exprs.length === 0){
    return null;
  }

  const exprs`,
        (0, builders_1.ts) `: $.TypeSet[]`,
        (0, builders_1.r) ` = _exprs.map(expr => castMaps.literalToTypeSet(expr));

  return $expressionify({
    __kind__: $.ExpressionKind.Set,
    __element__: exprs
      .map(expr => expr.__element__`,
        (0, builders_1.ts) ` as any`,
        (0, builders_1.r) `)
      .reduce(getSharedParent),
    __cardinality__: $.cardinalityUtil.mergeCardinalitiesVariadic(
      exprs.map(expr => expr.__cardinality__)`,
        (0, builders_1.ts) ` as any`,
        (0, builders_1.r) `
    ),
    __exprs__: exprs,
  })`,
        (0, builders_1.ts) ` as any`,
        (0, builders_1.r) `;

}`,
    ]);
    code.addExport("set");
};
exports.generateSetImpl = generateSetImpl;
