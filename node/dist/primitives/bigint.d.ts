interface JSBI {
    BigInt(from: number | string | boolean | object): JSBI;
    isBigInt(x: JSBI): boolean;
    toNumber(x: JSBI): number;
    unaryMinus(x: JSBI): JSBI;
    bitwiseNot(x: JSBI): JSBI;
    exponentiate(x: JSBI, y: JSBI): JSBI;
    multiply(x: JSBI, y: JSBI): JSBI;
    divide(x: JSBI, y: JSBI): JSBI;
    remainder(x: JSBI, y: JSBI): JSBI;
    add(x: JSBI, y: JSBI): JSBI;
    subtract(x: JSBI, y: JSBI): JSBI;
    leftShift(x: JSBI, y: JSBI): JSBI;
    signedRightShift(x: JSBI, y: JSBI): JSBI;
    lessThan(x: JSBI, y: JSBI): boolean;
    lessThanOrEqual(x: JSBI, y: JSBI): boolean;
    greaterThan(x: JSBI, y: JSBI): boolean;
    greaterThanOrEqual(x: JSBI, y: JSBI): boolean;
    equal(x: JSBI, y: JSBI): boolean;
    notEqual(x: JSBI, y: JSBI): boolean;
    bitwiseAnd(x: JSBI, y: JSBI): JSBI;
    bitwiseXor(x: JSBI, y: JSBI): JSBI;
    bitwiseOr(x: JSBI, y: JSBI): JSBI;
    asIntN(n: number, x: JSBI): JSBI;
    asUintN(n: number, x: JSBI): JSBI;
    ADD(x: any, y: any): any;
    LT(x: any, y: any): boolean;
    LE(x: any, y: any): boolean;
    GT(x: any, y: any): boolean;
    GE(x: any, y: any): boolean;
    EQ(x: any, y: any): boolean;
    NE(x: any, y: any): boolean;
}
export declare type BigIntLike = bigint | JSBI;
declare let JSBI: JSBI | null;
export declare const hasNativeBigInt: boolean;
export declare function plugJSBI(jsbi: any): void;
export declare const isBigInt: (val: BigIntLike) => boolean;
export declare const make: (val: string | number) => BigIntLike;
export declare const add: (op1: BigIntLike, op2: BigIntLike) => BigIntLike;
export declare const sub: (op1: BigIntLike, op2: BigIntLike) => BigIntLike;
export declare const div: (op1: BigIntLike, op2: BigIntLike) => BigIntLike;
export declare const mul: (op1: BigIntLike, op2: BigIntLike) => BigIntLike;
export declare const rshift: (op1: BigIntLike, op2: BigIntLike) => BigIntLike;
export declare const bitand: (op1: BigIntLike, op2: BigIntLike) => BigIntLike;
export declare const gte: (op1: BigIntLike, op2: BigIntLike) => boolean;
export declare const lt: (op1: BigIntLike, op2: BigIntLike) => boolean;
export declare const remainder: (op1: BigIntLike, op2: BigIntLike) => BigIntLike;
export {};
