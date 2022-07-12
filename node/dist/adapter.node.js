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
exports.hrTime = exports.homeDir = exports.HMAC = exports.H = exports.randomBytes = exports.input = exports.exists = exports.readFileUtf8 = exports.tls = exports.fs = exports.crypto = exports.net = exports.path = void 0;
const crypto = __importStar(require("crypto"));
exports.crypto = crypto;
const fs_1 = require("fs");
Object.defineProperty(exports, "fs", { enumerable: true, get: function () { return fs_1.promises; } });
const path = __importStar(require("path"));
exports.path = path;
const os = __importStar(require("os"));
const net = __importStar(require("net"));
exports.net = net;
const tls = __importStar(require("tls"));
exports.tls = tls;
const readline = __importStar(require("readline"));
const stream_1 = require("stream");
async function readFileUtf8(fn) {
    return fs_1.promises.readFile(fn, { encoding: "utf8" });
}
exports.readFileUtf8 = readFileUtf8;
async function exists(filepath) {
    try {
        await fs_1.promises.access(filepath);
        return true;
    }
    catch {
        return false;
    }
}
exports.exists = exists;
function input(message, params) {
    let silent = false;
    const output = !!(params === null || params === void 0 ? void 0 : params.silent)
        ? new stream_1.Writable({
            write(chunk, encoding, callback) {
                if (!silent)
                    process.stdout.write(chunk, encoding);
                callback();
            },
        })
        : process.stdout;
    const rl = readline.createInterface({
        input: process.stdin,
        output,
    });
    return new Promise((resolve, rej) => {
        rl.question(message, val => {
            rl.close();
            resolve(val);
        });
        silent = true;
    });
}
exports.input = input;
async function randomBytes(size) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(size, (err, buf) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(buf);
            }
        });
    });
}
exports.randomBytes = randomBytes;
function H(msg) {
    const sign = crypto.createHash("sha256");
    sign.update(msg);
    return sign.digest();
}
exports.H = H;
function HMAC(key, ...msgs) {
    const hm = crypto.createHmac("sha256", key);
    for (const msg of msgs) {
        hm.update(msg);
    }
    return hm.digest();
}
exports.HMAC = HMAC;
exports.homeDir = os.homedir;
function hrTime() {
    const [s, ns] = process.hrtime();
    return s * 1000 + ns / 1000000;
}
exports.hrTime = hrTime;
