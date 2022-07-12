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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadBuffer = exports.ReadMessageBuffer = exports.WriteMessageBuffer = exports.WriteBuffer = exports.BufferError = void 0;
const chars = __importStar(require("./chars"));
const ring_1 = require("./ring");
const bi = __importStar(require("./bigint"));
const compat = __importStar(require("../compat"));
const ifaces_1 = require("../ifaces");
const BUFFER_INC_SIZE = 4096;
const BUFFER_RING_CAPACITY = 2048;
const EMPTY_BUFFER = Buffer.allocUnsafe(0);
const isNode12 = !!Buffer["readBigInt64BE"];
class BufferError extends Error {
}
exports.BufferError = BufferError;
class WriteBuffer {
    constructor() {
        Object.defineProperty(this, "buffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "size", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.size = BUFFER_INC_SIZE;
        this.pos = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
    }
    get position() {
        return this.pos;
    }
    reset() {
        this.pos = 0;
    }
    ensureAlloced(extraLength) {
        const newSize = this.pos + extraLength;
        if (newSize > this.size) {
            this.__realloc(newSize);
        }
    }
    __realloc(newSize) {
        newSize += BUFFER_INC_SIZE;
        const newBuffer = Buffer.allocUnsafe(newSize);
        this.buffer.copy(newBuffer, 0, 0, this.pos);
        this.buffer = newBuffer;
        this.size = newSize;
    }
    writeChar(ch) {
        this.ensureAlloced(1);
        this.buffer.writeUInt8(ch, this.pos);
        this.pos++;
        return this;
    }
    writeString(s) {
        return this.writeBytes(Buffer.from(s, "utf-8"));
    }
    writeBytes(buf) {
        this.ensureAlloced(buf.length + 4);
        this.buffer.writeInt32BE(buf.length, this.pos);
        this.pos += 4;
        buf.copy(this.buffer, this.pos, 0, buf.length);
        this.pos += buf.length;
        return this;
    }
    writeInt16(i) {
        this.ensureAlloced(2);
        this.buffer.writeInt16BE(i, this.pos);
        this.pos += 2;
        return this;
    }
    writeInt32(i) {
        this.ensureAlloced(4);
        this.buffer.writeInt32BE(i, this.pos);
        this.pos += 4;
        return this;
    }
    writeFloat32(i) {
        this.ensureAlloced(4);
        this.buffer.writeFloatBE(i, this.pos);
        this.pos += 4;
        return this;
    }
    writeFloat64(i) {
        this.ensureAlloced(8);
        this.buffer.writeDoubleBE(i, this.pos);
        this.pos += 8;
        return this;
    }
    writeUInt16(i) {
        this.ensureAlloced(2);
        this.buffer.writeUInt16BE(i, this.pos);
        this.pos += 2;
        return this;
    }
    writeUInt32(i) {
        this.ensureAlloced(4);
        this.buffer.writeUInt32BE(i, this.pos);
        this.pos += 4;
        return this;
    }
    writeInt64(i) {
        const hi = Math.floor(i / 0x100000000);
        const lo = i - hi * 0x100000000;
        this.writeInt32(hi);
        this.writeUInt32(lo);
        return this;
    }
    writeBigInt64(i) {
        let ii = i;
        if (bi.lt(ii, bi.make(0))) {
            ii = bi.add(bi.make("18446744073709551616"), i);
        }
        const hi = bi.rshift(ii, bi.make(32));
        const lo = bi.bitand(ii, bi.make(0xffffffff));
        this.writeUInt32(Number(hi));
        this.writeUInt32(Number(lo));
        return this;
    }
    writeBuffer(buf) {
        const len = buf.length;
        this.ensureAlloced(len);
        buf.copy(this.buffer, this.pos, 0, len);
        this.pos += len;
        return this;
    }
    unwrap() {
        return this.buffer.slice(0, this.pos);
    }
}
exports.WriteBuffer = WriteBuffer;
class WriteMessageBuffer {
    constructor() {
        Object.defineProperty(this, "buffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "messagePos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.messagePos = -1;
        this.buffer = new WriteBuffer();
    }
    reset() {
        this.messagePos = -1;
        this.buffer.reset();
        return this;
    }
    beginMessage(mtype) {
        if (this.messagePos >= 0) {
            throw new BufferError("cannot begin a new message: the previous message is not finished");
        }
        this.messagePos = this.buffer.position;
        this.buffer.writeChar(mtype);
        this.buffer.writeInt32(0);
        return this;
    }
    endMessage() {
        if (this.messagePos < 0) {
            throw new BufferError("cannot end the message: no current message");
        }
        this.buffer.buffer.writeInt32BE(this.buffer.position - this.messagePos - 1, this.messagePos + 1);
        this.messagePos = -1;
        return this;
    }
    writeHeaders(headers) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeHeaders: no current message");
        }
        if (!headers) {
            this.buffer.writeUInt16(0);
            return this;
        }
        const entries = Object.entries(headers).filter(([_, value]) => value !== undefined);
        this.buffer.writeUInt16(entries.length);
        for (const [code, value] of entries) {
            this.buffer.writeUInt16(ifaces_1.HeaderCodes[code]);
            if (Buffer.isBuffer(value)) {
                this.buffer.writeUInt32(value.byteLength);
                this.buffer.writeBuffer(value);
            }
            else if (typeof value === "string") {
                this.buffer.writeString(value);
            }
            else {
                throw new BufferError("cannot write header: value is not a Buffer or string");
            }
        }
        return this;
    }
    writeChar(ch) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeChar: no current message");
        }
        this.buffer.writeChar(ch);
        return this;
    }
    writeString(s) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeString: no current message");
        }
        this.buffer.writeString(s);
        return this;
    }
    writeBytes(val) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeBytes: no current message");
        }
        this.buffer.writeBytes(val);
        return this;
    }
    writeInt16(i) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeInt16: no current message");
        }
        this.buffer.writeInt16(i);
        return this;
    }
    writeInt32(i) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeInt32: no current message");
        }
        this.buffer.writeInt32(i);
        return this;
    }
    writeUInt16(i) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeInt16: no current message");
        }
        this.buffer.writeUInt16(i);
        return this;
    }
    writeUInt32(i) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeInt32: no current message");
        }
        this.buffer.writeUInt32(i);
        return this;
    }
    writeBuffer(buf) {
        if (this.messagePos < 0) {
            throw new BufferError("cannot writeBuffer: no current message");
        }
        this.buffer.writeBuffer(buf);
        return this;
    }
    writeSync() {
        if (this.messagePos >= 0) {
            throw new BufferError("cannot writeSync: the previous message is not finished");
        }
        this.buffer.writeBuffer(SYNC_MESSAGE);
        return this;
    }
    writeFlush() {
        if (this.messagePos >= 0) {
            throw new BufferError("cannot writeFlush: the previous message is not finished");
        }
        this.buffer.writeBuffer(FLUSH_MESSAGE);
        return this;
    }
    unwrap() {
        if (this.messagePos >= 0) {
            throw new BufferError("cannot unwrap: an unfinished message is in the buffer");
        }
        return this.buffer.unwrap();
    }
}
exports.WriteMessageBuffer = WriteMessageBuffer;
const SYNC_MESSAGE = new WriteMessageBuffer()
    .beginMessage(chars.$S)
    .endMessage()
    .unwrap();
const FLUSH_MESSAGE = new WriteMessageBuffer()
    .beginMessage(chars.$H)
    .endMessage()
    .unwrap();
class ReadMessageBuffer {
    constructor() {
        Object.defineProperty(this, "bufs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "len", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "buf0", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pos0", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "len0", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "curMessageType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "curMessageLen", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "curMessageLenUnread", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "curMessageReady", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.bufs = new ring_1.RingBuffer({ capacity: BUFFER_RING_CAPACITY });
        this.buf0 = null;
        this.pos0 = 0;
        this.len0 = 0;
        this.len = 0;
        this.curMessageType = 0;
        this.curMessageLen = 0;
        this.curMessageLenUnread = 0;
        this.curMessageReady = false;
    }
    get length() {
        return this.len;
    }
    feed(buf) {
        if (this.buf0 == null ||
            (this.pos0 === this.len0 && this.bufs.length === 0)) {
            this.buf0 = buf;
            this.len0 = buf.length;
            this.pos0 = 0;
            this.len = this.len0;
            return false;
        }
        else {
            return this.feedEnqueue(buf);
        }
    }
    feedEnqueue(buf) {
        this.bufs.enq(buf);
        this.len += buf.length;
        const isFull = this.bufs.full;
        if (isFull && this.curMessageType !== 0) {
            throw new Error("query result is too big: buffer overflow");
        }
        return isFull;
    }
    ensureFirstBuf() {
        if (this.pos0 === this.len0) {
            this.__nextBuf();
        }
        const buf0 = this.buf0;
        if (buf0 == null || buf0.length < 1) {
            throw new BufferError("empty buffer");
        }
        return buf0;
    }
    checkOverread(size) {
        if (this.curMessageLenUnread < size || size > this.len) {
            throw new BufferError("buffer overread");
        }
    }
    __nextBuf() {
        const nextBuf = this.bufs.deq();
        if (nextBuf == null) {
            throw new BufferError("buffer overread");
        }
        this.buf0 = nextBuf;
        this.pos0 = 0;
        this.len0 = nextBuf.length;
    }
    discardBuffer(size) {
        this.ensureFirstBuf();
        while (true) {
            if (this.pos0 + size > this.len0) {
                const nread = this.len0 - this.pos0;
                this.pos0 = this.len0;
                this.len -= nread;
                size -= nread;
                this.ensureFirstBuf();
            }
            else {
                this.pos0 += size;
                this.len -= size;
                break;
            }
        }
    }
    _finishMessage() {
        this.curMessageLen = 0;
        this.curMessageLenUnread = 0;
        this.curMessageReady = false;
        this.curMessageType = 0;
    }
    __readBufferCopy(buf0, size) {
        const ret = Buffer.allocUnsafe(size);
        let retPos = 0;
        while (true) {
            if (this.pos0 + size > this.len0) {
                const nread = this.len0 - this.pos0;
                buf0.copy(ret, retPos, this.pos0, this.len0);
                retPos += nread;
                this.pos0 = this.len0;
                this.len -= nread;
                size -= nread;
                buf0 = this.ensureFirstBuf();
            }
            else {
                buf0.copy(ret, retPos, this.pos0, this.pos0 + size);
                this.pos0 += size;
                this.len -= size;
                break;
            }
        }
        return ret;
    }
    _readBuffer(size) {
        const buf0 = this.ensureFirstBuf();
        if (size === 0) {
            return EMPTY_BUFFER;
        }
        if (this.pos0 + size <= this.len0) {
            const ret = buf0.slice(this.pos0, this.pos0 + size);
            this.pos0 += size;
            this.len -= size;
            return ret;
        }
        return this.__readBufferCopy(buf0, size);
    }
    readBuffer(size) {
        this.checkOverread(size);
        const buf = this._readBuffer(size);
        this.curMessageLenUnread -= size;
        return buf;
    }
    readUUID() {
        const buf = this.readBuffer(16);
        return buf.toString("hex");
    }
    readChar() {
        this.checkOverread(1);
        const buf0 = this.ensureFirstBuf();
        const ret = buf0.readUInt8(this.pos0);
        this.pos0++;
        this.curMessageLenUnread--;
        this.len--;
        return ret;
    }
    readInt16() {
        this.checkOverread(2);
        const buf0 = this.ensureFirstBuf();
        if (this.pos0 + 2 <= this.len0) {
            const ret = buf0.readInt16BE(this.pos0);
            this.pos0 += 2;
            this.curMessageLenUnread -= 2;
            this.len -= 2;
            return ret;
        }
        const buf = this._readBuffer(2);
        this.curMessageLenUnread -= 2;
        return buf.readInt16BE(0);
    }
    readInt32() {
        this.checkOverread(4);
        const buf0 = this.ensureFirstBuf();
        if (this.pos0 + 4 <= this.len0) {
            const ret = buf0.readInt32BE(this.pos0);
            this.pos0 += 4;
            this.curMessageLenUnread -= 4;
            this.len -= 4;
            return ret;
        }
        const buf = this._readBuffer(4);
        this.curMessageLenUnread -= 4;
        return buf.readInt32BE(0);
    }
    readUInt16() {
        this.checkOverread(2);
        const buf0 = this.ensureFirstBuf();
        if (this.pos0 + 2 <= this.len0) {
            const ret = buf0.readUInt16BE(this.pos0);
            this.pos0 += 2;
            this.curMessageLenUnread -= 2;
            this.len -= 2;
            return ret;
        }
        const buf = this._readBuffer(2);
        this.curMessageLenUnread -= 2;
        return buf.readUInt16BE(0);
    }
    readUInt32() {
        this.checkOverread(4);
        const buf0 = this.ensureFirstBuf();
        if (this.pos0 + 4 <= this.len0) {
            const ret = buf0.readUInt32BE(this.pos0);
            this.pos0 += 4;
            this.curMessageLenUnread -= 4;
            this.len -= 4;
            return ret;
        }
        const buf = this._readBuffer(4);
        this.curMessageLenUnread -= 4;
        return buf.readUInt32BE(0);
    }
    readString() {
        const len = this.readInt32();
        const buf = this.readBuffer(len);
        return buf.toString("utf-8");
    }
    readLenPrefixedBuffer() {
        const len = this.readInt32();
        return this.readBuffer(len);
    }
    takeMessage() {
        if (this.curMessageReady) {
            return true;
        }
        if (this.curMessageType === 0) {
            if (this.len < 1) {
                return false;
            }
            const buf0 = this.ensureFirstBuf();
            this.curMessageType = buf0.readUInt8(this.pos0);
            this.pos0++;
            this.len--;
        }
        if (this.curMessageLen === 0) {
            if (this.len < 4) {
                return false;
            }
            const buf0 = this.ensureFirstBuf();
            if (this.pos0 + 4 <= this.len0) {
                this.curMessageLen = buf0.readInt32BE(this.pos0);
                this.pos0 += 4;
                this.len -= 4;
            }
            else {
                const buf = this._readBuffer(4);
                this.curMessageLen = buf.readInt32BE(0);
            }
            this.curMessageLenUnread = this.curMessageLen - 4;
        }
        if (this.len < this.curMessageLenUnread) {
            return false;
        }
        this.curMessageReady = true;
        return true;
    }
    getMessageType() {
        return this.curMessageType;
    }
    takeMessageType(mtype) {
        if (this.curMessageReady) {
            return this.curMessageType === mtype;
        }
        if (this.len >= 1) {
            const buf0 = this.ensureFirstBuf();
            const unreadMessageType = buf0.readUInt8(this.pos0);
            return mtype === unreadMessageType && this.takeMessage();
        }
        return false;
    }
    putMessage() {
        if (!this.curMessageReady) {
            throw new BufferError("cannot put message: no message taken");
        }
        if (this.curMessageLenUnread !== this.curMessageLen - 4) {
            throw new BufferError("cannot put message: message is partially read");
        }
        this.curMessageReady = false;
    }
    discardMessage() {
        if (!this.curMessageReady) {
            throw new BufferError("no message to discard");
        }
        if (this.curMessageLenUnread > 0) {
            this.discardBuffer(this.curMessageLenUnread);
        }
        this._finishMessage();
    }
    consumeMessage() {
        if (!this.curMessageReady) {
            throw new BufferError("no message to consume");
        }
        let buf;
        if (this.curMessageLenUnread > 0) {
            buf = this._readBuffer(this.curMessageLenUnread);
            this.curMessageLenUnread = 0;
        }
        else {
            buf = EMPTY_BUFFER;
        }
        this._finishMessage();
        return buf;
    }
    consumeMessageInto(frb) {
        if (!this.curMessageReady) {
            throw new BufferError("no message to consume");
        }
        if (this.curMessageLenUnread > 0) {
            if (this.pos0 + this.curMessageLenUnread <= this.len0) {
                const len = this.pos0 + this.curMessageLenUnread;
                ReadBuffer.slice(frb, this.buf0, this.pos0, len);
                this.pos0 = len;
                this.len -= this.curMessageLenUnread;
            }
            else {
                const buf = this._readBuffer(this.curMessageLenUnread);
                ReadBuffer.init(frb, buf);
            }
            this.curMessageLenUnread = 0;
        }
        else {
            ReadBuffer.init(frb, EMPTY_BUFFER);
        }
        this._finishMessage();
    }
    finishMessage() {
        if (this.curMessageType === 0 || !this.curMessageReady) {
            return;
        }
        if (this.curMessageLenUnread) {
            throw new BufferError(`cannot finishMessage: unread data in message ` +
                `"${chars.chr(this.curMessageType)}"`);
        }
        this._finishMessage();
    }
}
exports.ReadMessageBuffer = ReadMessageBuffer;
class ReadBuffer {
    constructor(buf) {
        Object.defineProperty(this, "buffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "len", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.buffer = buf;
        this.len = buf.length;
        this.pos = 0;
    }
    get position() {
        return this.pos;
    }
    get length() {
        return this.len - this.pos;
    }
    finish() {
        if (this.len !== this.pos) {
            throw new BufferError("unexpected trailing data in buffer");
        }
    }
    discard(size) {
        if (this.pos + size > this.len) {
            throw new BufferError("buffer overread");
        }
        this.pos += size;
    }
    readUInt8() {
        if (this.pos + 1 > this.len) {
            throw new BufferError("buffer overread");
        }
        const num = this.buffer.readUInt8(this.pos);
        this.pos++;
        return num;
    }
    readUInt16() {
        if (this.pos + 2 > this.len) {
            throw new BufferError("buffer overread");
        }
        const num = this.buffer.readUInt16BE(this.pos);
        this.pos += 2;
        return num;
    }
    readInt8() {
        if (this.pos + 1 > this.len) {
            throw new BufferError("buffer overread");
        }
        const num = this.buffer.readInt8(this.pos);
        this.pos++;
        return num;
    }
    readInt16() {
        if (this.pos + 2 > this.len) {
            throw new BufferError("buffer overread");
        }
        const num = this.buffer.readInt16BE(this.pos);
        this.pos += 2;
        return num;
    }
    readInt32() {
        if (this.pos + 4 > this.len) {
            throw new BufferError("buffer overread");
        }
        const num = this.buffer.readInt32BE(this.pos);
        this.pos += 4;
        return num;
    }
    readFloat32() {
        if (this.pos + 4 > this.len) {
            throw new BufferError("buffer overread");
        }
        const num = this.buffer.readFloatBE(this.pos);
        this.pos += 4;
        return num;
    }
    readFloat64() {
        if (this.pos + 8 > this.len) {
            throw new BufferError("buffer overread");
        }
        const num = this.buffer.readDoubleBE(this.pos);
        this.pos += 8;
        return num;
    }
    readUInt32() {
        if (this.pos + 4 > this.len) {
            throw new BufferError("buffer overread");
        }
        const num = this.buffer.readUInt32BE(this.pos);
        this.pos += 4;
        return num;
    }
    reportInt64Overflow(hi, lo) {
        const bhi = bi.make(hi);
        const blo = bi.make(lo >>> 0);
        const num = bi.add(bi.mul(bhi, bi.make(0x100000000)), blo);
        throw new Error(`integer overflow: cannot unpack <std::int64>'${num.toString()}' ` +
            `into JavaScript Number type without losing precision`);
    }
    readInt64() {
        if (this.pos + 8 > this.len) {
            throw new BufferError("buffer overread");
        }
        const hi = this.buffer.readInt32BE(this.pos);
        const lo = this.buffer.readInt32BE(this.pos + 4);
        this.pos += 8;
        if (hi === 0) {
            return lo >>> 0;
        }
        else if (hi >= -0x200000 && hi < 0x200000) {
            return hi * 4294967296 + (lo >>> 0);
        }
        return this.reportInt64Overflow(hi, lo);
    }
    readBigInt64Fallback() {
        if (bi.hasNativeBigInt) {
            const hi = this.buffer.readUInt32BE(this.pos);
            const lo = this.buffer.readUInt32BE(this.pos + 4);
            this.pos += 8;
            let res = (BigInt(hi) << BigInt(32)) + BigInt(lo);
            if (hi >= 0x80000000) {
                res = BigInt("-18446744073709551616") + res;
            }
            return res;
        }
        else {
            const buf = this.readBuffer(8);
            const snum = compat.decodeInt64ToString(buf);
            return bi.make(snum);
        }
    }
    readBigInt64() {
        if (this.pos + 8 > this.len) {
            throw new BufferError("buffer overread");
        }
        if (isNode12) {
            const ret = this.buffer.readBigInt64BE(this.pos);
            this.pos += 8;
            return ret;
        }
        else {
            return this.readBigInt64Fallback();
        }
    }
    readBuffer(size) {
        if (this.pos + size > this.len) {
            throw new BufferError("buffer overread");
        }
        const buf = this.buffer.slice(this.pos, this.pos + size);
        this.pos += size;
        return buf;
    }
    readUUID() {
        if (this.pos + 16 > this.len) {
            throw new BufferError("buffer overread");
        }
        const buf = this.buffer.slice(this.pos, this.pos + 16);
        this.pos += 16;
        return buf.toString("hex");
    }
    consumeAsString() {
        if (this.pos === this.len) {
            return "";
        }
        const res = this.buffer.toString("utf8", this.pos, this.len);
        this.pos = this.len;
        return res;
    }
    consumeAsBuffer() {
        const res = this.buffer.slice(this.pos, this.len);
        this.pos = this.len;
        return res;
    }
    sliceInto(frb, size) {
        if (this.pos + size > this.len) {
            throw new BufferError("buffer overread");
        }
        frb.buffer = this.buffer;
        frb.pos = this.pos;
        frb.len = this.pos + size;
        this.pos += size;
    }
    static init(frb, buffer) {
        frb.buffer = buffer;
        frb.pos = 0;
        frb.len = buffer.length;
    }
    static slice(frb, buffer, pos, len) {
        frb.buffer = buffer;
        frb.pos = pos;
        frb.len = len;
    }
    static alloc() {
        return new this(EMPTY_BUFFER);
    }
}
exports.ReadBuffer = ReadBuffer;
