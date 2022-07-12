"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImplicitCastableRootTypes = exports.getTypesSpecificity = exports.sortFuncopOverloads = exports.findPathOfAnytype = exports.expandFuncopAnytypeOverloads = void 0;
const generateObjectTypes_1 = require("../generators/generateObjectTypes");
const strictMap_1 = require("../strictMap");
const genutil_1 = require("./genutil");
const util_1 = require("./util");
function expandFuncopAnytypeOverloads(overloads, types, casts, implicitCastableRootTypes) {
    return util_1.util.flatMap(overloads, (funcDef, overloadIndex) => {
        const overload = {
            ...funcDef,
            overloadIndex,
            params: groupParams(funcDef.params, types),
            anytypes: null,
        };
        const anytypeParams = [
            ...overload.params.positional,
            ...overload.params.named,
        ].filter(param => param.type.name.includes("anytype"));
        if (anytypeParams.length) {
            const hasArrayType = anytypeParams.some(param => param.type.name.includes("array<anytype>")) || overload.return_type.name.includes("array<anytype>");
            const catchAllOverload = {
                ...overload,
                anytypes: {
                    kind: "noncastable",
                    type: [hasArrayType ? "$.NonArrayType" : "$.BaseType"],
                    typeObj: anytypeParams[0].type,
                    refName: anytypeParams[0].typeName,
                    refPath: findPathOfAnytype(anytypeParams[0].type.id, types),
                },
            };
            if (anytypeParams.length === 1) {
                return [catchAllOverload];
            }
            else {
                return [
                    ...implicitCastableRootTypes.map(rootTypeId => ({
                        ...overload,
                        anytypes: {
                            kind: "castable",
                            type: (0, generateObjectTypes_1.getStringRepresentation)(types.get(rootTypeId), {
                                types,
                                casts: casts.implicitCastFromMap,
                            }).staticType,
                            returnAnytypeWrapper: "_.syntax.getSharedParentPrimitive",
                        },
                    })),
                    ...(!hasArrayType
                        ? implicitCastableRootTypes.map(rootTypeId => ({
                            ...overload,
                            anytypes: {
                                kind: "castable",
                                type: (0, genutil_1.frag) `$.ArrayType<${(0, generateObjectTypes_1.getStringRepresentation)(types.get(rootTypeId), {
                                    types,
                                    casts: casts.implicitCastFromMap,
                                }).staticType}>`,
                                returnAnytypeWrapper: "_.syntax.getSharedParentPrimitive",
                            },
                        }))
                        : []),
                    {
                        ...overload,
                        anytypes: {
                            kind: "castable",
                            type: [`$.ObjectType`],
                            returnAnytypeWrapper: "_.syntax.mergeObjectTypes",
                        },
                    },
                    {
                        ...overload,
                        anytypes: {
                            kind: "castable",
                            type: [`$.AnyTupleType`],
                            returnAnytypeWrapper: "_.syntax.getSharedParentPrimitive",
                        },
                    },
                    catchAllOverload,
                ];
            }
        }
        else {
            return [overload];
        }
    });
}
exports.expandFuncopAnytypeOverloads = expandFuncopAnytypeOverloads;
function groupParams(params, types) {
    return {
        positional: params
            .filter(param => param.kind === "PositionalParam" || param.kind === "VariadicParam")
            .map((param, i) => {
            let paramType = types.get(param.type.id);
            if (param.kind === "VariadicParam") {
                if (paramType.kind !== "array") {
                    throw new Error("Variadic param not array type");
                }
                paramType = types.get(paramType.array_element_id);
            }
            return {
                ...param,
                type: paramType,
                internalName: (0, genutil_1.makeValidIdent)({ id: `${i}`, name: param.name }),
                typeName: `P${i + 1}`,
            };
        }),
        named: params
            .filter(param => param.kind === "NamedOnlyParam")
            .map(param => ({
            ...param,
            type: types.get(param.type.id),
            typeName: `NamedArgs[${(0, genutil_1.quote)(param.name)}]`,
        })),
    };
}
function findPathOfAnytype(typeId, types) {
    const path = _findPathOfAnytype(typeId, types);
    if (!path) {
        throw new Error(`Cannot find 'anytype' in ${types.get(typeId).name}`);
    }
    return path;
}
exports.findPathOfAnytype = findPathOfAnytype;
function _findPathOfAnytype(typeId, types) {
    const type = types.get(typeId);
    if (type.name === "anytype") {
        return '["__element__"]';
    }
    if (type.kind === "array") {
        const elPath = _findPathOfAnytype(type.array_element_id, types);
        if (elPath) {
            return `["__element__"]${elPath}`;
        }
    }
    else if (type.kind === "tuple") {
        const isNamed = type.tuple_elements[0].name !== "0";
        for (const { name, target_id } of type.tuple_elements) {
            const elPath = _findPathOfAnytype(target_id, types);
            if (elPath) {
                return `[${isNamed ? (0, genutil_1.quote)(name) : name}]${elPath}`;
            }
        }
    }
    return null;
}
function sortFuncopOverloads(overloads, typeSpecificities) {
    return [...overloads].sort((a, b) => {
        var _a, _b;
        let i = 0;
        while (true) {
            let paramA = (_a = a.params[i]) !== null && _a !== void 0 ? _a : null;
            let paramB = (_b = b.params[i]) !== null && _b !== void 0 ? _b : null;
            if ((paramA === null || paramA === void 0 ? void 0 : paramA.kind) === "NamedOnlyParam")
                paramA = null;
            if ((paramB === null || paramB === void 0 ? void 0 : paramB.kind) === "NamedOnlyParam")
                paramB = null;
            if (paramA === null && paramB === null)
                return 0;
            if (paramA === null)
                return -1;
            if (paramB === null)
                return 1;
            const specA = typeSpecificities.get(paramA.type.id);
            const specB = typeSpecificities.get(paramB.type.id);
            if (specA !== specB) {
                return specA - specB;
            }
            i++;
        }
    });
}
exports.sortFuncopOverloads = sortFuncopOverloads;
function getTypesSpecificity(types, casts) {
    var _a;
    const typeSpecificities = new Map();
    let currentSpec = 0;
    let typesToVisit = [...types.values()].filter(type => { var _a; return ((_a = casts.implicitCastFromMap[type.id]) !== null && _a !== void 0 ? _a : []).length === 0; });
    const nextTypesToVisit = new Set();
    while (typesToVisit.length) {
        for (const type of typesToVisit) {
            typeSpecificities.set(type, type.name === "anytype" ? Infinity : currentSpec);
            for (const castableTo of (_a = casts.implicitCastMap[type.id]) !== null && _a !== void 0 ? _a : []) {
                nextTypesToVisit.add(types.get(castableTo));
            }
        }
        typesToVisit = [...nextTypesToVisit.values()];
        nextTypesToVisit.clear();
        currentSpec += 1;
    }
    const typeIdToSpecificity = new strictMap_1.StrictMap();
    for (const [type, spec] of typeSpecificities) {
        typeIdToSpecificity.set(type.id, spec);
    }
    return typeIdToSpecificity;
}
exports.getTypesSpecificity = getTypesSpecificity;
function getImplicitCastableRootTypes(casts) {
    return Object.entries(casts.implicitCastMap)
        .filter(([id, castableTo]) => {
        var _a, _b;
        return (castableTo.length === 0 &&
            ((_b = (_a = casts.implicitCastFromMap[id]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0);
    })
        .map(([id]) => id);
}
exports.getImplicitCastableRootTypes = getImplicitCastableRootTypes;
