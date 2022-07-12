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
exports.UUIDCodec = void 0;
const ifaces_1 = require("./ifaces");
function UUIDBufferFromString(uuid) {
    let uuidClean = uuid;
    if (uuidClean.length !== 32) {
        uuidClean = uuidClean.replace(/\-/g, "");
        if (uuidClean.length !== 32) {
            throw new TypeError(`invalid UUID "${uuid}"`);
        }
    }
    const buf = Buffer.from(uuidClean, "hex");
    if (buf.length !== 16) {
        throw new TypeError(`invalid UUID "${uuid}"`);
    }
    return buf;
}
class UUIDCodec extends ifaces_1.ScalarCodec {
    encode(buf, object) {
        if (typeof object === "string") {
            const val = object;
            const ubuf = UUIDBufferFromString(val);
            buf.writeInt32(16);
            buf.writeBuffer(ubuf);
        }
        else {
            throw new Error(`cannot encode UUID "${object}": invalid type`);
        }
    }
    decode(buf) {
        return buf.readBuffer(16).toString("hex");
    }
}
exports.UUIDCodec = UUIDCodec;
