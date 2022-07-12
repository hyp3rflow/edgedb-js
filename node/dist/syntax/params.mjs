import { ExpressionKind, Cardinality, TypeKind, } from "../reflection/index";
import { $expressionify } from "./path";
export function optional(type) {
    return {
        __kind__: ExpressionKind.OptionalParam,
        __type__: type,
    };
}
const complexParamKinds = new Set([TypeKind.tuple, TypeKind.namedtuple]);
export function params(paramsDef, expr) {
    const paramExprs = {};
    for (const [key, param] of Object.entries(paramsDef)) {
        const paramType = param.__kind__ === ExpressionKind.OptionalParam ? param.__type__ : param;
        const isComplex = complexParamKinds.has(paramType.__kind__) ||
            (paramType.__kind__ === TypeKind.array &&
                complexParamKinds.has(paramType.__element__.__kind__));
        paramExprs[key] = $expressionify({
            __kind__: ExpressionKind.Param,
            __element__: paramType,
            __cardinality__: param.__kind__ === ExpressionKind.OptionalParam
                ? Cardinality.AtMostOne
                : Cardinality.One,
            __name__: key,
            __isComplex__: isComplex,
        });
    }
    const returnExpr = expr(paramExprs);
    return $expressionify({
        __kind__: ExpressionKind.WithParams,
        __element__: returnExpr.__element__,
        __cardinality__: returnExpr.__cardinality__,
        __expr__: returnExpr,
        __params__: Object.values(paramExprs),
    });
}
