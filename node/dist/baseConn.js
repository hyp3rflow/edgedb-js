"use strict";
/*!
 * This source file is part of the EdgeDB open source project.
 *
 * Copyright 2019-present MagicStack Inc. and the EdgeDB authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRawConnection = exports.PROTO_VER_MIN = exports.PROTO_VER = void 0;
const codecs_1 = require("./codecs/codecs");
const namedtuple_1 = require("./codecs/namedtuple");
const object_1 = require("./codecs/object");
const tuple_1 = require("./codecs/tuple");
const utils_1 = require("./utils");
const errors = __importStar(require("./errors"));
const resolve_1 = require("./errors/resolve");
const ifaces_1 = require("./ifaces");
const buffer_1 = require("./primitives/buffer");
const chars = __importStar(require("./primitives/chars"));
const event_1 = __importDefault(require("./primitives/event"));
const lru_1 = __importDefault(require("./primitives/lru"));
exports.PROTO_VER = [1, 0];
exports.PROTO_VER_MIN = [0, 9];
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus[TransactionStatus["TRANS_IDLE"] = 0] = "TRANS_IDLE";
    TransactionStatus[TransactionStatus["TRANS_ACTIVE"] = 1] = "TRANS_ACTIVE";
    TransactionStatus[TransactionStatus["TRANS_INTRANS"] = 2] = "TRANS_INTRANS";
    TransactionStatus[TransactionStatus["TRANS_INERROR"] = 3] = "TRANS_INERROR";
    TransactionStatus[TransactionStatus["TRANS_UNKNOWN"] = 4] = "TRANS_UNKNOWN";
})(TransactionStatus || (TransactionStatus = {}));
var Capabilities;
(function (Capabilities) {
    Capabilities[Capabilities["MODIFICATONS"] = 1] = "MODIFICATONS";
    Capabilities[Capabilities["SESSION_CONFIG"] = 2] = "SESSION_CONFIG";
    Capabilities[Capabilities["TRANSACTION"] = 4] = "TRANSACTION";
    Capabilities[Capabilities["DDL"] = 8] = "DDL";
    Capabilities[Capabilities["PERSISTENT_CONFIG"] = 16] = "PERSISTENT_CONFIG";
})(Capabilities || (Capabilities = {}));
const NO_TRANSACTION_CAPABILITIES_BYTES = Buffer.from([
    255,
    255,
    255,
    255,
    255,
    255,
    255,
    255 & ~Capabilities.TRANSACTION & ~Capabilities.SESSION_CONFIG,
]);
const OLD_ERROR_CODES = new Map([
    [84082689, 84082945],
    [84082690, 84082946],
]);
class BaseRawConnection {
    constructor(registry) {
        Object.defineProperty(this, "connected", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "alwaysUseOptimisticFlow", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "exposeErrorAttributes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "lastStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "codecsRegistry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "queryCodecCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverSecret", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverSettings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverXactStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "buffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "messageWaiter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "connWaiter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "connAbortWaiter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_abortedWith", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "protocolVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: exports.PROTO_VER
        });
        Object.defineProperty(this, "isLegacyProtocol", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.buffer = new buffer_1.ReadMessageBuffer();
        this.codecsRegistry = registry;
        this.queryCodecCache = new lru_1.default({ capacity: 1000 });
        this.lastStatus = null;
        this.serverSecret = null;
        this.serverSettings = {};
        this.serverXactStatus = TransactionStatus.TRANS_UNKNOWN;
        this.messageWaiter = null;
        this.connWaiter = new event_1.default();
        this.connAbortWaiter = new event_1.default();
    }
    throwNotImplemented(method) {
        throw new Error(`method ${method} is not implemented`);
    }
    async _waitForMessage() {
        this.throwNotImplemented("_waitForMessage");
    }
    _sendData(data) {
        this.throwNotImplemented("_sendData");
    }
    getConnAbortError() {
        var _a;
        return ((_a = this._abortedWith) !== null && _a !== void 0 ? _a : new errors.InterfaceError(`client has been closed`));
    }
    _checkState() {
        if (this.isClosed()) {
            throw this.getConnAbortError();
        }
    }
    _abortWithError(err) {
        this._abortedWith = err;
        this._abort();
    }
    _ignoreHeaders() {
        let numFields = this.buffer.readInt16();
        while (numFields) {
            this.buffer.readInt16();
            this.buffer.readLenPrefixedBuffer();
            numFields--;
        }
    }
    _abortWaiters(err) {
        var _a;
        if (!this.connWaiter.done) {
            this.connWaiter.setError(err);
        }
        (_a = this.messageWaiter) === null || _a === void 0 ? void 0 : _a.setError(err);
        this.messageWaiter = null;
    }
    _parseHeaders() {
        const ret = new Map();
        let numFields = this.buffer.readInt16();
        while (numFields) {
            const key = this.buffer.readInt16();
            const value = this.buffer.readLenPrefixedBuffer();
            ret.set(key, value);
            numFields--;
        }
        return ret;
    }
    _parseDescribeTypeMessage() {
        const headers = this._parseHeaders();
        let capabilities = -1;
        if (headers.has(ifaces_1.HeaderCodes.capabilities)) {
            capabilities = Number(headers.get(ifaces_1.HeaderCodes.capabilities).readBigInt64BE());
        }
        const cardinality = this.buffer.readChar();
        const inTypeId = this.buffer.readUUID();
        const inTypeData = this.buffer.readLenPrefixedBuffer();
        const outTypeId = this.buffer.readUUID();
        const outTypeData = this.buffer.readLenPrefixedBuffer();
        this.buffer.finishMessage();
        let inCodec = this.codecsRegistry.getCodec(inTypeId);
        if (inCodec == null) {
            inCodec = this.codecsRegistry.buildCodec(inTypeData, this.protocolVersion);
        }
        let outCodec = this.codecsRegistry.getCodec(outTypeId);
        if (outCodec == null) {
            outCodec = this.codecsRegistry.buildCodec(outTypeData, this.protocolVersion);
        }
        return [
            cardinality,
            inCodec,
            outCodec,
            capabilities,
            inTypeData,
            outTypeData,
        ];
    }
    _parseCommandCompleteMessage() {
        this._ignoreHeaders();
        const status = this.buffer.readString();
        this.buffer.finishMessage();
        return status;
    }
    _parseErrorMessage() {
        var _a;
        this.buffer.readChar();
        const code = this.buffer.readUInt32();
        const message = this.buffer.readString();
        const errorType = (0, resolve_1.resolveErrorCode)((_a = OLD_ERROR_CODES.get(code)) !== null && _a !== void 0 ? _a : code);
        const err = new errorType(message);
        if (this.exposeErrorAttributes) {
            err.attrs = this._parseHeaders();
        }
        else {
            this._ignoreHeaders();
        }
        this.buffer.finishMessage();
        return err;
    }
    _parseSyncMessage() {
        this._parseHeaders();
        const status = this.buffer.readChar();
        switch (status) {
            case chars.$I:
                this.serverXactStatus = TransactionStatus.TRANS_IDLE;
                break;
            case chars.$T:
                this.serverXactStatus = TransactionStatus.TRANS_INTRANS;
                break;
            case chars.$E:
                this.serverXactStatus = TransactionStatus.TRANS_INERROR;
                break;
            default:
                this.serverXactStatus = TransactionStatus.TRANS_UNKNOWN;
        }
        this.buffer.finishMessage();
    }
    _parseDataMessages(codec, result) {
        const frb = buffer_1.ReadBuffer.alloc();
        const $D = chars.$D;
        const buffer = this.buffer;
        if (Array.isArray(result)) {
            while (buffer.takeMessageType($D)) {
                buffer.consumeMessageInto(frb);
                frb.discard(6);
                result.push(codec.decode(frb));
                frb.finish();
            }
        }
        else {
            while (buffer.takeMessageType($D)) {
                const msg = buffer.consumeMessage();
                result.writeChar($D);
                result.writeInt32(msg.length + 4);
                result.writeBuffer(msg);
            }
        }
    }
    _parseServerSettings(name, value) {
        switch (name) {
            case "suggested_pool_concurrency":
                this.serverSettings.suggested_pool_concurrency = parseInt(value.toString("utf8"), 10);
                break;
            case "system_config":
                const buf = new buffer_1.ReadBuffer(value);
                const typedescLen = buf.readInt32() - 16;
                const typedescId = buf.readUUID();
                const typedesc = buf.readBuffer(typedescLen);
                let codec = this.codecsRegistry.getCodec(typedescId);
                if (codec === null) {
                    codec = this.codecsRegistry.buildCodec(typedesc, this.protocolVersion);
                }
                buf.discard(4);
                const data = codec.decode(buf);
                buf.finish();
                this.serverSettings.system_config = data;
                break;
            default:
                this.serverSettings[name] = value;
                break;
        }
    }
    _fallthrough() {
        const mtype = this.buffer.getMessageType();
        switch (mtype) {
            case chars.$S: {
                const name = this.buffer.readString();
                const value = this.buffer.readLenPrefixedBuffer();
                this._parseServerSettings(name, value);
                this.buffer.finishMessage();
                break;
            }
            case chars.$L: {
                const severity = this.buffer.readChar();
                const code = this.buffer.readUInt32();
                const message = this.buffer.readString();
                this._parseHeaders();
                this.buffer.finishMessage();
                console.info("SERVER MESSAGE", severity, code, message);
                break;
            }
            default:
                throw new Error(`unexpected message type ${mtype} ("${chars.chr(mtype)}")`);
        }
    }
    async _parse(query, asJson, expectOne, alwaysDescribe, options) {
        var _a;
        const wb = new buffer_1.WriteMessageBuffer();
        const parseSendsTypeData = (0, utils_1.versionGreaterThanOrEqual)(this.protocolVersion, [0, 14]);
        wb.beginMessage(chars.$P)
            .writeHeaders({
            explicitObjectids: "true",
            ...((_a = options === null || options === void 0 ? void 0 : options.headers) !== null && _a !== void 0 ? _a : {}),
            allowCapabilities: NO_TRANSACTION_CAPABILITIES_BYTES,
        })
            .writeChar(asJson ? chars.$j : chars.$b)
            .writeChar(expectOne ? chars.$o : chars.$m);
        if (this.isLegacyProtocol) {
            wb.writeString("");
        }
        wb.writeString(query).endMessage();
        wb.writeSync();
        this._sendData(wb.unwrap());
        let cardinality;
        let inTypeId;
        let outTypeId;
        let inCodec;
        let outCodec;
        let capabilities = -1;
        let parsing = true;
        let error = null;
        let inCodecData = null;
        let outCodecData = null;
        while (parsing) {
            if (!this.buffer.takeMessage()) {
                await this._waitForMessage();
            }
            const mtype = this.buffer.getMessageType();
            switch (mtype) {
                case chars.$1: {
                    const headers = this._parseHeaders();
                    if (headers.has(ifaces_1.HeaderCodes.capabilities)) {
                        capabilities = Number(headers.get(ifaces_1.HeaderCodes.capabilities).readBigInt64BE());
                    }
                    cardinality = this.buffer.readChar();
                    if (parseSendsTypeData) {
                        inTypeId = this.buffer.readUUID();
                        inCodecData = this.buffer.readLenPrefixedBuffer();
                        outTypeId = this.buffer.readUUID();
                        outCodecData = this.buffer.readLenPrefixedBuffer();
                    }
                    else {
                        inTypeId = this.buffer.readUUID();
                        outTypeId = this.buffer.readUUID();
                    }
                    this.buffer.finishMessage();
                    break;
                }
                case chars.$E: {
                    error = this._parseErrorMessage();
                    break;
                }
                case chars.$Z: {
                    this._parseSyncMessage();
                    parsing = false;
                    break;
                }
                default:
                    this._fallthrough();
            }
        }
        if (error != null) {
            throw error;
        }
        if (inTypeId == null || outTypeId == null) {
            throw new Error("did not receive in/out type ids in Parse response");
        }
        inCodec = this.codecsRegistry.getCodec(inTypeId);
        outCodec = this.codecsRegistry.getCodec(outTypeId);
        if (inCodec == null && inCodecData != null) {
            inCodec = this.codecsRegistry.buildCodec(inCodecData, this.protocolVersion);
        }
        if (outCodec == null && outCodecData != null) {
            outCodec = this.codecsRegistry.buildCodec(outCodecData, this.protocolVersion);
        }
        if (inCodec == null ||
            outCodec == null ||
            (alwaysDescribe && !parseSendsTypeData)) {
            if (parseSendsTypeData) {
                throw new Error("in/out codecs were not sent");
            }
            wb.reset();
            wb.beginMessage(chars.$D)
                .writeInt16(0)
                .writeChar(chars.$T)
                .writeString("")
                .endMessage()
                .writeSync();
            this._sendData(wb.unwrap());
            parsing = true;
            while (parsing) {
                if (!this.buffer.takeMessage()) {
                    await this._waitForMessage();
                }
                const mtype = this.buffer.getMessageType();
                switch (mtype) {
                    case chars.$T: {
                        try {
                            [
                                cardinality,
                                inCodec,
                                outCodec,
                                capabilities,
                                inCodecData,
                                outCodecData,
                            ] = this._parseDescribeTypeMessage();
                        }
                        catch (e) {
                            error = e;
                        }
                        break;
                    }
                    case chars.$E: {
                        error = this._parseErrorMessage();
                        break;
                    }
                    case chars.$Z: {
                        this._parseSyncMessage();
                        parsing = false;
                        break;
                    }
                    default:
                        this._fallthrough();
                }
            }
            if (error != null) {
                throw error;
            }
        }
        if (cardinality == null || outCodec == null || inCodec == null) {
            throw new Error("failed to receive type information in response to a Parse message");
        }
        return [
            cardinality,
            inCodec,
            outCodec,
            capabilities,
            inCodecData,
            outCodecData,
        ];
    }
    _encodeArgs(args, inCodec) {
        if ((0, utils_1.versionGreaterThanOrEqual)(this.protocolVersion, [0, 12])) {
            if (inCodec === codecs_1.NULL_CODEC) {
                if (args != null) {
                    throw new errors.QueryArgumentError(`This query does not contain any query parameters, ` +
                        `but query arguments were provided to the 'query*()' method`);
                }
                return codecs_1.NullCodec.BUFFER;
            }
            if (inCodec instanceof object_1.ObjectCodec) {
                return inCodec.encodeArgs(args);
            }
            throw new Error("invalid input codec");
        }
        else {
            if (inCodec === tuple_1.EMPTY_TUPLE_CODEC) {
                if (args != null) {
                    throw new errors.QueryArgumentError(`This query does not contain any query parameters, ` +
                        `but query arguments were provided to the 'query*()' method`);
                }
                return tuple_1.EmptyTupleCodec.BUFFER;
            }
            if (inCodec instanceof namedtuple_1.NamedTupleCodec ||
                inCodec instanceof tuple_1.TupleCodec) {
                return inCodec.encodeArgs(args);
            }
            throw new Error("invalid input codec");
        }
    }
    async _executeFlow(args, inCodec, outCodec, result) {
        const wb = new buffer_1.WriteMessageBuffer();
        wb.beginMessage(chars.$E)
            .writeHeaders({ allowCapabilities: NO_TRANSACTION_CAPABILITIES_BYTES })
            .writeString("")
            .writeBuffer(this._encodeArgs(args, inCodec))
            .endMessage()
            .writeSync();
        this._sendData(wb.unwrap());
        let parsing = true;
        let error = null;
        while (parsing) {
            if (!this.buffer.takeMessage()) {
                await this._waitForMessage();
            }
            const mtype = this.buffer.getMessageType();
            switch (mtype) {
                case chars.$D: {
                    if (error == null) {
                        try {
                            this._parseDataMessages(outCodec, result);
                        }
                        catch (e) {
                            error = e;
                            this.buffer.finishMessage();
                        }
                    }
                    else {
                        this.buffer.discardMessage();
                    }
                    break;
                }
                case chars.$C: {
                    this.lastStatus = this._parseCommandCompleteMessage();
                    break;
                }
                case chars.$E: {
                    error = this._parseErrorMessage();
                    break;
                }
                case chars.$Z: {
                    this._parseSyncMessage();
                    parsing = false;
                    break;
                }
                default:
                    this._fallthrough();
            }
        }
        if (error != null) {
            throw error;
        }
    }
    async _optimisticExecuteFlow(args, asJson, expectOne, requiredOne, inCodec, outCodec, query, result, options) {
        var _a;
        const wb = new buffer_1.WriteMessageBuffer();
        wb.beginMessage(chars.$O);
        wb.writeHeaders({
            explicitObjectids: "true",
            ...((_a = options === null || options === void 0 ? void 0 : options.headers) !== null && _a !== void 0 ? _a : {}),
            allowCapabilities: NO_TRANSACTION_CAPABILITIES_BYTES,
        });
        wb.writeChar(asJson ? chars.$j : chars.$b);
        wb.writeChar(expectOne ? chars.$o : chars.$m);
        wb.writeString(query);
        wb.writeBuffer(inCodec.tidBuffer);
        wb.writeBuffer(outCodec.tidBuffer);
        wb.writeBuffer(this._encodeArgs(args, inCodec));
        wb.endMessage();
        wb.writeSync();
        this._sendData(wb.unwrap());
        let reExec = false;
        let error = null;
        let parsing = true;
        let newCard = null;
        let capabilities = -1;
        while (parsing) {
            if (!this.buffer.takeMessage()) {
                await this._waitForMessage();
            }
            const mtype = this.buffer.getMessageType();
            switch (mtype) {
                case chars.$D: {
                    if (error == null) {
                        try {
                            this._parseDataMessages(outCodec, result);
                        }
                        catch (e) {
                            error = e;
                            this.buffer.finishMessage();
                        }
                    }
                    else {
                        this.buffer.discardMessage();
                    }
                    break;
                }
                case chars.$C: {
                    this.lastStatus = this._parseCommandCompleteMessage();
                    break;
                }
                case chars.$Z: {
                    this._parseSyncMessage();
                    parsing = false;
                    break;
                }
                case chars.$T: {
                    try {
                        [newCard, inCodec, outCodec, capabilities] =
                            this._parseDescribeTypeMessage();
                        const key = this._getQueryCacheKey(query, asJson, expectOne);
                        this.queryCodecCache.set(key, [
                            newCard,
                            inCodec,
                            outCodec,
                            capabilities,
                        ]);
                        reExec = true;
                    }
                    catch (e) {
                        error = e;
                    }
                    break;
                }
                case chars.$E: {
                    error = this._parseErrorMessage();
                    break;
                }
                default:
                    this._fallthrough();
            }
        }
        if (error != null) {
            throw error;
        }
        if (reExec) {
            this._validateFetchCardinality(newCard, asJson, requiredOne);
            if (this.isLegacyProtocol) {
                return await this._executeFlow(args, inCodec, outCodec, result);
            }
            else {
                return await this._optimisticExecuteFlow(args, asJson, expectOne, requiredOne, inCodec, outCodec, query, result, options);
            }
        }
    }
    _getQueryCacheKey(query, asJson, expectOne) {
        return [asJson, expectOne, query.length, query].join(";");
    }
    _validateFetchCardinality(card, asJson, requiredOne) {
        if (requiredOne && card === chars.$n) {
            throw new errors.NoDataError(`query executed via queryRequiredSingle${asJson ? "JSON" : ""}() returned no data`);
        }
    }
    async fetch(query, args = null, asJson, expectOne, requiredOne = false) {
        var _a;
        this._checkState();
        const key = this._getQueryCacheKey(query, asJson, expectOne);
        const ret = new Array();
        if (this.queryCodecCache.has(key)) {
            const [card, inCodec, outCodec] = this.queryCodecCache.get(key);
            this._validateFetchCardinality(card, asJson, requiredOne);
            await this._optimisticExecuteFlow(args, asJson, expectOne, requiredOne, inCodec, outCodec, query, ret);
        }
        else {
            const [card, inCodec, outCodec, capabilities] = await this._parse(query, asJson, expectOne, false);
            this._validateFetchCardinality(card, asJson, requiredOne);
            this.queryCodecCache.set(key, [card, inCodec, outCodec, capabilities]);
            if (this.alwaysUseOptimisticFlow || !this.isLegacyProtocol) {
                await this._optimisticExecuteFlow(args, asJson, expectOne, requiredOne, inCodec, outCodec, query, ret);
            }
            else {
                await this._executeFlow(args, inCodec, outCodec, ret);
            }
        }
        if (expectOne) {
            if (requiredOne && !ret.length) {
                throw new errors.NoDataError("query returned no data");
            }
            else {
                return (_a = ret[0]) !== null && _a !== void 0 ? _a : (asJson ? "null" : null);
            }
        }
        else {
            if (ret && ret.length) {
                if (asJson) {
                    return ret[0];
                }
                else {
                    return ret;
                }
            }
            else {
                if (asJson) {
                    return "[]";
                }
                else {
                    return ret;
                }
            }
        }
    }
    getQueryCapabilities(query, asJson, expectOne) {
        var _a, _b;
        const key = this._getQueryCacheKey(query, asJson, expectOne);
        return (_b = (_a = this.queryCodecCache.get(key)) === null || _a === void 0 ? void 0 : _a[3]) !== null && _b !== void 0 ? _b : null;
    }
    async execute(query, allowTransactionCommands = false) {
        this._checkState();
        const wb = new buffer_1.WriteMessageBuffer();
        wb.beginMessage(chars.$Q)
            .writeHeaders({
            allowCapabilities: !allowTransactionCommands
                ? NO_TRANSACTION_CAPABILITIES_BYTES
                : undefined,
        })
            .writeString(query)
            .endMessage();
        this._sendData(wb.unwrap());
        let error = null;
        let parsing = true;
        while (parsing) {
            if (!this.buffer.takeMessage()) {
                await this._waitForMessage();
            }
            const mtype = this.buffer.getMessageType();
            switch (mtype) {
                case chars.$C: {
                    this.lastStatus = this._parseCommandCompleteMessage();
                    break;
                }
                case chars.$Z: {
                    this._parseSyncMessage();
                    parsing = false;
                    break;
                }
                case chars.$E: {
                    error = this._parseErrorMessage();
                    break;
                }
                default:
                    this._fallthrough();
            }
        }
        if (error != null) {
            throw error;
        }
    }
    async resetState() {
        if (this.connected &&
            this.serverXactStatus !== TransactionStatus.TRANS_IDLE) {
            try {
                await this.execute(`rollback`, true);
            }
            catch {
                this._abortWithError(new errors.ClientConnectionClosedError("failed to reset state"));
            }
        }
    }
    _abort() {
        this.connected = false;
        this._abortWaiters(this.getConnAbortError());
        if (!this.connAbortWaiter.done) {
            this.connAbortWaiter.set();
        }
    }
    isClosed() {
        return !this.connected;
    }
    async close() {
        this._abort();
    }
    async rawParse(query, headers) {
        const result = await this._parse(query, false, false, true, {
            headers,
        });
        return [
            result[1],
            result[2],
            result[4],
            result[5],
            this.protocolVersion,
        ];
    }
    async rawExecute(query, outCodec, headers, inCodec, args = null) {
        const result = new buffer_1.WriteBuffer();
        inCodec =
            inCodec !== null && inCodec !== void 0 ? inCodec : ((0, utils_1.versionGreaterThanOrEqual)(this.protocolVersion, [0, 12])
                ? codecs_1.NULL_CODEC
                : tuple_1.EMPTY_TUPLE_CODEC);
        await this._optimisticExecuteFlow(args, false, false, false, inCodec, outCodec, query, result, { headers });
        return result.unwrap();
    }
    async rawExecuteScript(script) {
        await this.execute(script, true);
    }
}
exports.BaseRawConnection = BaseRawConnection;
