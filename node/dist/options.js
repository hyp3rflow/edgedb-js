"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = exports.TransactionOptions = exports.RetryOptions = exports.RetryCondition = exports.IsolationLevel = exports.defaultBackoff = void 0;
const errors = __importStar(require("./errors"));
function defaultBackoff(attempt) {
    return 2 ** attempt * 100 + Math.random() * 100;
}
exports.defaultBackoff = defaultBackoff;
var IsolationLevel;
(function (IsolationLevel) {
    IsolationLevel["Serializable"] = "SERIALIZABLE";
})(IsolationLevel = exports.IsolationLevel || (exports.IsolationLevel = {}));
var RetryCondition;
(function (RetryCondition) {
    RetryCondition[RetryCondition["TransactionConflict"] = 0] = "TransactionConflict";
    RetryCondition[RetryCondition["NetworkError"] = 1] = "NetworkError";
})(RetryCondition = exports.RetryCondition || (exports.RetryCondition = {}));
class RetryRule {
    constructor(attempts, backoff) {
        Object.defineProperty(this, "attempts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "backoff", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.attempts = attempts;
        this.backoff = backoff;
    }
}
class RetryOptions {
    constructor(attempts = 3, backoff = defaultBackoff) {
        Object.defineProperty(this, "default", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "overrides", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.default = new RetryRule(attempts, backoff);
        this.overrides = new Map();
    }
    withRule(condition, attempts, backoff) {
        const def = this.default;
        const overrides = new Map(this.overrides);
        overrides.set(condition, new RetryRule(attempts !== null && attempts !== void 0 ? attempts : def.attempts, backoff !== null && backoff !== void 0 ? backoff : def.backoff));
        const result = Object.create(RetryOptions.prototype);
        result.default = def;
        result.overrides = overrides;
        return result;
    }
    getRuleForException(err) {
        let result;
        if (err instanceof errors.TransactionConflictError) {
            result = this.overrides.get(RetryCondition.TransactionConflict);
        }
        else if (err instanceof errors.ClientError) {
            result = this.overrides.get(RetryCondition.NetworkError);
        }
        return result !== null && result !== void 0 ? result : this.default;
    }
    static defaults() {
        return new RetryOptions();
    }
}
exports.RetryOptions = RetryOptions;
class TransactionOptions {
    constructor({ isolation = IsolationLevel.Serializable, readonly = false, deferrable = false, } = {}) {
        Object.defineProperty(this, "isolation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "readonly", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "deferrable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.isolation = isolation;
        this.readonly = readonly;
        this.deferrable = deferrable;
    }
    static defaults() {
        return new TransactionOptions();
    }
}
exports.TransactionOptions = TransactionOptions;
class Options {
    constructor({ retryOptions = RetryOptions.defaults(), transactionOptions = TransactionOptions.defaults(), } = {}) {
        Object.defineProperty(this, "retryOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "transactionOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.retryOptions = retryOptions;
        this.transactionOptions = transactionOptions;
    }
    withTransactionOptions(opt) {
        return new Options({
            retryOptions: this.retryOptions,
            transactionOptions: opt instanceof TransactionOptions ? opt : new TransactionOptions(opt),
        });
    }
    withRetryOptions(opt) {
        return new Options({
            transactionOptions: this.transactionOptions,
            retryOptions: opt instanceof RetryOptions
                ? opt
                : new RetryOptions(opt.attempts, opt.backoff),
        });
    }
    static defaults() {
        return new Options();
    }
}
exports.Options = Options;
