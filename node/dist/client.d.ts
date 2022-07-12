/*!
 * This source file is part of the EdgeDB open source project.
 *
 * Copyright 2020-present MagicStack Inc. and the EdgeDB authors.
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
import { ConnectConfig } from "./conUtils";
import { Executor, QueryArgs } from "./ifaces";
import { Options, RetryOptions, SimpleRetryOptions, SimpleTransactionOptions, TransactionOptions } from "./options";
import { RawConnection } from "./rawConn";
import { Transaction } from "./transaction";
export declare class ClientConnectionHolder {
    private _pool;
    private _connection;
    private _options;
    private _inUse;
    constructor(pool: ClientPool);
    get options(): Options;
    _getConnection(): Promise<RawConnection>;
    get connectionOpen(): boolean;
    acquire(options: Options): Promise<ClientConnectionHolder>;
    release(): Promise<void>;
    terminate(): void;
    transaction<T>(action: (transaction: Transaction) => Promise<T>): Promise<T>;
    private retryingFetch;
    execute(query: string): Promise<void>;
    query(query: string, args?: QueryArgs): Promise<any>;
    queryJSON(query: string, args?: QueryArgs): Promise<string>;
    querySingle(query: string, args?: QueryArgs): Promise<any>;
    querySingleJSON(query: string, args?: QueryArgs): Promise<string>;
    queryRequiredSingle(query: string, args?: QueryArgs): Promise<any>;
    queryRequiredSingleJSON(query: string, args?: QueryArgs): Promise<string>;
}
declare class ClientPool {
    private _closing;
    private _queue;
    private _holders;
    private _userConcurrency;
    private _suggestedConcurrency;
    private _connectConfig;
    private _codecsRegistry;
    constructor(dsn?: string, options?: ConnectOptions);
    private validateClientOptions;
    _getStats(): {
        openConnections: number;
        queueLength: number;
    };
    ensureConnected(): Promise<void>;
    private get _concurrency();
    private _resizeHolderPool;
    private __normalizedConnectConfig;
    private _getNormalizedConnectConfig;
    getNewConnection(): Promise<RawConnection>;
    acquireHolder(options: Options): Promise<ClientConnectionHolder>;
    enqueue(holder: ClientConnectionHolder): void;
    close(): Promise<void>;
    private _terminate;
    terminate(): void;
    isClosed(): boolean;
}
export interface ClientOptions {
    concurrency?: number;
}
export declare class Client implements Executor {
    private pool;
    private options;
    private constructor();
    withTransactionOptions(opts: TransactionOptions | SimpleTransactionOptions): Client;
    withRetryOptions(opts: RetryOptions | SimpleRetryOptions): Client;
    ensureConnected(): Promise<this>;
    isClosed(): boolean;
    close(): Promise<void>;
    terminate(): void;
    transaction<T>(action: (transaction: Transaction) => Promise<T>): Promise<T>;
    execute(query: string): Promise<void>;
    query<T = unknown>(query: string, args?: QueryArgs): Promise<T[]>;
    queryJSON(query: string, args?: QueryArgs): Promise<string>;
    querySingle<T = unknown>(query: string, args?: QueryArgs): Promise<T | null>;
    querySingleJSON(query: string, args?: QueryArgs): Promise<string>;
    queryRequiredSingle<T = unknown>(query: string, args?: QueryArgs): Promise<T>;
    queryRequiredSingleJSON(query: string, args?: QueryArgs): Promise<string>;
}
export declare type ConnectOptions = ConnectConfig & ClientOptions;
export declare function createClient(options?: string | ConnectOptions | null): Client;
export {};
