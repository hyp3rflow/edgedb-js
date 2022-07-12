import * as errors from "./errors";
export declare type BackoffFunction = (n: number) => number;
export declare function defaultBackoff(attempt: number): number;
export declare enum IsolationLevel {
    Serializable = "SERIALIZABLE"
}
export declare enum RetryCondition {
    TransactionConflict = 0,
    NetworkError = 1
}
declare class RetryRule {
    readonly attempts: number;
    readonly backoff: BackoffFunction;
    constructor(attempts: number, backoff: BackoffFunction);
}
export interface PartialRetryRule {
    condition?: RetryCondition;
    attempts?: number;
    backoff?: BackoffFunction;
}
export interface SimpleRetryOptions {
    attempts?: number;
    backoff?: BackoffFunction;
}
export declare class RetryOptions {
    readonly default: RetryRule;
    private overrides;
    constructor(attempts?: number, backoff?: BackoffFunction);
    withRule(condition: RetryCondition, attempts?: number, backoff?: BackoffFunction): RetryOptions;
    getRuleForException(err: errors.EdgeDBError): RetryRule;
    static defaults(): RetryOptions;
}
export interface SimpleTransactionOptions {
    isolation?: IsolationLevel;
    readonly?: boolean;
    deferrable?: boolean;
}
export declare class TransactionOptions {
    readonly isolation: IsolationLevel;
    readonly readonly: boolean;
    readonly deferrable: boolean;
    constructor({ isolation, readonly, deferrable, }?: SimpleTransactionOptions);
    static defaults(): TransactionOptions;
}
export declare class Options {
    readonly retryOptions: RetryOptions;
    readonly transactionOptions: TransactionOptions;
    constructor({ retryOptions, transactionOptions, }?: {
        retryOptions?: RetryOptions;
        transactionOptions?: TransactionOptions;
    });
    withTransactionOptions(opt: TransactionOptions | SimpleTransactionOptions): Options;
    withRetryOptions(opt: RetryOptions | SimpleRetryOptions): Options;
    static defaults(): Options;
}
export {};
