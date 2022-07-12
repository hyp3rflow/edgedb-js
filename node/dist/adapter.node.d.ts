/// <reference types="node" />
/// <reference types="node" />
import * as crypto from "crypto";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import * as net from "net";
import * as tls from "tls";
export { path, net, crypto, fs, tls };
export declare function readFileUtf8(fn: string): Promise<string>;
export declare function exists(filepath: string): Promise<boolean>;
export declare function input(message: string, params?: {
    silent?: boolean;
}): Promise<string>;
export declare function randomBytes(size: number): Promise<Buffer>;
export declare function H(msg: Buffer): Buffer;
export declare function HMAC(key: Buffer, ...msgs: Buffer[]): Buffer;
export declare const homeDir: typeof os.homedir;
export declare function hrTime(): number;
