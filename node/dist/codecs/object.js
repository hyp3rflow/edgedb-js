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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectCodec = void 0;
const ifaces_1 = require("./ifaces");
const buffer_1 = require("../primitives/buffer");
const consts_1 = require("./consts");
const EDGE_POINTER_IS_IMPLICIT = 1 << 0;
const EDGE_POINTER_IS_LINKPROP = 1 << 1;
class ObjectCodec extends ifaces_1.Codec {
    constructor(tid, codecs, names, flags, cards) {
        super(tid);
        Object.defineProperty(this, "codecs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fields", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "namesSet", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cardinalities", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.codecs = codecs;
        this.fields = new Array(names.length);
        this.namesSet = new Set();
        this.cardinalities = cards;
        for (let i = 0; i < names.length; i++) {
            const isLinkprop = !!(flags[i] & EDGE_POINTER_IS_LINKPROP);
            const name = isLinkprop ? `@${names[i]}` : names[i];
            this.fields[i] = {
                name,
                implicit: !!(flags[i] & EDGE_POINTER_IS_IMPLICIT),
                linkprop: isLinkprop,
            };
            this.namesSet.add(name);
        }
    }
    encode(_buf, _object) {
        throw new Error("Objects cannot be passed as arguments");
    }
    encodeArgs(args) {
        if (this.fields[0].name === "0") {
            return this._encodePositionalArgs(args);
        }
        return this._encodeNamedArgs(args);
    }
    _encodePositionalArgs(args) {
        if (!Array.isArray(args)) {
            throw new Error("an array of arguments was expected");
        }
        const codecs = this.codecs;
        const codecsLen = codecs.length;
        if (args.length !== codecsLen) {
            throw new Error(`expected ${codecsLen} argument${codecsLen === 1 ? "" : "s"}, got ${args.length}`);
        }
        const elemData = new buffer_1.WriteBuffer();
        for (let i = 0; i < codecsLen; i++) {
            elemData.writeInt32(0);
            const arg = args[i];
            if (arg == null) {
                const card = this.cardinalities[i];
                if (card === consts_1.ONE || card === consts_1.AT_LEAST_ONE) {
                    throw new Error(`argument ${this.fields[i].name} is required, but received ${arg}`);
                }
                elemData.writeInt32(-1);
            }
            else {
                const codec = codecs[i];
                codec.encode(elemData, arg);
            }
        }
        const elemBuf = elemData.unwrap();
        const buf = new buffer_1.WriteBuffer();
        buf.writeInt32(4 + elemBuf.length);
        buf.writeInt32(codecsLen);
        buf.writeBuffer(elemBuf);
        return buf.unwrap();
    }
    _encodeNamedArgs(args) {
        if (args == null) {
            throw new Error("One or more named arguments expected, received null");
        }
        const keys = Object.keys(args);
        const fields = this.fields;
        const namesSet = this.namesSet;
        const codecs = this.codecs;
        const codecsLen = codecs.length;
        if (keys.length > codecsLen) {
            const extraKeys = keys.filter(key => !namesSet.has(key));
            throw new Error(`Unused named argument${extraKeys.length === 1 ? "" : "s"}: "${extraKeys.join('", "')}"`);
        }
        const elemData = new buffer_1.WriteBuffer();
        for (let i = 0; i < codecsLen; i++) {
            const key = fields[i].name;
            const val = args[key];
            elemData.writeInt32(0);
            if (val == null) {
                const card = this.cardinalities[i];
                if (card === consts_1.ONE || card === consts_1.AT_LEAST_ONE) {
                    throw new Error(`argument ${this.fields[i].name} is required, but received ${val}`);
                }
                elemData.writeInt32(-1);
            }
            else {
                const codec = codecs[i];
                codec.encode(elemData, val);
            }
        }
        const elemBuf = elemData.unwrap();
        const buf = new buffer_1.WriteBuffer();
        buf.writeInt32(4 + elemBuf.length);
        buf.writeInt32(codecsLen);
        buf.writeBuffer(elemBuf);
        return buf.unwrap();
    }
    decode(buf) {
        const codecs = this.codecs;
        const fields = this.fields;
        const els = buf.readUInt32();
        if (els !== codecs.length) {
            throw new Error(`cannot decode Object: expected ${codecs.length} elements, got ${els}`);
        }
        const elemBuf = buffer_1.ReadBuffer.alloc();
        const result = {};
        for (let i = 0; i < els; i++) {
            buf.discard(4);
            const elemLen = buf.readInt32();
            const name = fields[i].name;
            let val = null;
            if (elemLen !== -1) {
                buf.sliceInto(elemBuf, elemLen);
                val = codecs[i].decode(elemBuf);
                elemBuf.finish();
            }
            result[name] = val;
        }
        return result;
    }
    getSubcodecs() {
        return Array.from(this.codecs);
    }
    getFields() {
        return Array.from(this.fields);
    }
    getKind() {
        return "object";
    }
}
exports.ObjectCodec = ObjectCodec;
