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
/// <reference types="node" />
import { ICodec } from "./codecs/ifaces";
import { CodecsRegistry } from "./codecs/registry";
import { ParseOptions, PrepareMessageHeaders, ProtocolVersion, QueryArgs } from "./ifaces";
import { ReadMessageBuffer, WriteBuffer } from "./primitives/buffer";
import Event from "./primitives/event";
import LRU from "./primitives/lru";
export declare const PROTO_VER: ProtocolVersion;
export declare const PROTO_VER_MIN: ProtocolVersion;
export declare class BaseRawConnection {
    protected connected: boolean;
    protected alwaysUseOptimisticFlow: boolean;
    protected exposeErrorAttributes: boolean;
    protected lastStatus: string | null;
    protected codecsRegistry: CodecsRegistry;
    protected queryCodecCache: LRU<string, [number, ICodec, ICodec, number]>;
    protected serverSecret: Buffer | null;
    private serverXactStatus;
    protected buffer: ReadMessageBuffer;
    protected messageWaiter: Event | null;
    protected connWaiter: Event;
    connAbortWaiter: Event;
    protected _abortedWith: Error | null;
    protocolVersion: ProtocolVersion;
    isLegacyProtocol: boolean;
    protected throwNotImplemented(method: string): never;
    protected _waitForMessage(): Promise<void>;
    protected _sendData(data: Buffer): void;
    getConnAbortError(): Error;
    protected _checkState(): void;
    protected _abortWithError(err: Error): void;
    protected _ignoreHeaders(): void;
    protected _abortWaiters(err: Error): void;
    protected _parseHeaders(): Map<number, Buffer>;
    private _parseDescribeTypeMessage;
    protected _parseCommandCompleteMessage(): string;
    protected _parseErrorMessage(): Error;
    protected _parseSyncMessage(): void;
    private _parseDataMessages;
    private _parseServerSettings;
    protected _fallthrough(): void;
    _parse(query: string, asJson: boolean, expectOne: boolean, alwaysDescribe: boolean, options?: ParseOptions): Promise<[number, ICodec, ICodec, number, Buffer | null, Buffer | null]>;
    private _encodeArgs;
    _executeFlow(args: QueryArgs, inCodec: ICodec, outCodec: ICodec, result: Array<any> | WriteBuffer): Promise<void>;
    private _optimisticExecuteFlow;
    private _getQueryCacheKey;
    private _validateFetchCardinality;
    fetch(query: string, args: QueryArgs | undefined, asJson: boolean, expectOne: boolean, requiredOne?: boolean): Promise<any>;
    getQueryCapabilities(query: string, asJson: boolean, expectOne: boolean): number | null;
    execute(query: string, allowTransactionCommands?: boolean): Promise<void>;
    resetState(): Promise<void>;
    protected _abort(): void;
    isClosed(): boolean;
    close(): Promise<void>;
    rawParse(query: string, headers?: PrepareMessageHeaders): Promise<[ICodec, ICodec, Buffer, Buffer, ProtocolVersion]>;
    rawExecute(query: string, outCodec: ICodec, headers?: PrepareMessageHeaders, inCodec?: ICodec, args?: QueryArgs): Promise<Buffer>;
    rawExecuteScript(script: string): Promise<void>;
}
