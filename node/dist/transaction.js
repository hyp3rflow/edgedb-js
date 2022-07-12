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
exports.Transaction = exports.TransactionState = void 0;
const errors = __importStar(require("./errors"));
var TransactionState;
(function (TransactionState) {
    TransactionState[TransactionState["ACTIVE"] = 0] = "ACTIVE";
    TransactionState[TransactionState["COMMITTED"] = 1] = "COMMITTED";
    TransactionState[TransactionState["ROLLEDBACK"] = 2] = "ROLLEDBACK";
    TransactionState[TransactionState["FAILED"] = 3] = "FAILED";
})(TransactionState = exports.TransactionState || (exports.TransactionState = {}));
class Transaction {
    constructor(holder, rawConn) {
        Object.defineProperty(this, "_holder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_rawConn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_opInProgress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._holder = holder;
        this._rawConn = rawConn;
        this._state = TransactionState.ACTIVE;
        this._opInProgress = false;
    }
    static async _startTransaction(holder) {
        const rawConn = await holder._getConnection();
        await rawConn.resetState();
        const options = holder.options.transactionOptions;
        await rawConn.execute(`START TRANSACTION ISOLATION ${options.isolation}, ${options.readonly ? "READ ONLY" : "READ WRITE"}, ${options.deferrable ? "" : "NOT "}DEFERRABLE;`, true);
        return new Transaction(holder, rawConn);
    }
    async _waitForConnAbort() {
        await this._rawConn.connAbortWaiter.wait();
        const abortError = this._rawConn.getConnAbortError();
        if (abortError instanceof errors.EdgeDBError &&
            abortError.source instanceof errors.TransactionTimeoutError) {
            throw abortError.source;
        }
        else {
            throw abortError;
        }
    }
    async _runOp(opname, op, errMessage) {
        if (this._opInProgress) {
            throw new errors.InterfaceError(errMessage !== null && errMessage !== void 0 ? errMessage : "Another query is in progress. Use the query methods " +
                "on 'Client' to run queries concurrently.");
        }
        if (this._state !== TransactionState.ACTIVE) {
            throw new errors.InterfaceError(`cannot ${opname}; the transaction is ${this._state === TransactionState.COMMITTED
                ? "already committed"
                : this._state === TransactionState.ROLLEDBACK
                    ? "already rolled back"
                    : "in error state"}`);
        }
        this._opInProgress = true;
        try {
            return await op();
        }
        finally {
            this._opInProgress = false;
        }
    }
    async _commit() {
        await this._runOp("commit", async () => {
            await this._rawConn.execute("COMMIT", true);
            this._state = TransactionState.COMMITTED;
        }, "A query is still in progress after transaction block has returned.");
    }
    async _rollback() {
        await this._runOp("rollback", async () => {
            await this._rawConn.execute("ROLLBACK", true);
            this._state = TransactionState.ROLLEDBACK;
        }, "A query is still in progress after transaction block has returned.");
    }
    async execute(query) {
        return this._runOp("execute", () => this._rawConn.execute(query));
    }
    async query(query, args) {
        return this._runOp("query", () => this._rawConn.fetch(query, args, false, false));
    }
    async queryJSON(query, args) {
        return this._runOp("queryJSON", () => this._rawConn.fetch(query, args, true, false));
    }
    async querySingle(query, args) {
        return this._runOp("querySingle", () => this._rawConn.fetch(query, args, false, true));
    }
    async querySingleJSON(query, args) {
        return this._runOp("querySingleJSON", () => this._rawConn.fetch(query, args, true, true));
    }
    async queryRequiredSingle(query, args) {
        return this._runOp("queryRequiredSingle", () => this._rawConn.fetch(query, args, false, true, true));
    }
    async queryRequiredSingleJSON(query, args) {
        return this._runOp("queryRequiredSingleJSON", () => this._rawConn.fetch(query, args, true, true, true));
    }
}
exports.Transaction = Transaction;
