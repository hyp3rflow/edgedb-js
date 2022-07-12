import { DirBuilder } from "./builders";
import { ConnectConfig } from "../conUtils";
import { Casts } from "./queries/getCasts";
import { ScalarTypes } from "./queries/getScalars";
import { FunctionTypes } from "./queries/getFunctions";
import { OperatorTypes } from "./queries/getOperators";
import { Globals } from "./queries/getGlobals";
import * as introspect from "./queries/getTypes";
export declare const configFileHeader = "// EdgeDB query builder. To update, run `npx edgeql-js`";
export declare type GeneratorParams = {
    dir: DirBuilder;
    types: introspect.Types;
    typesByName: Record<string, introspect.Type>;
    casts: Casts;
    scalars: ScalarTypes;
    functions: FunctionTypes;
    globals: Globals;
    operators: OperatorTypes;
    isDeno: boolean;
};
export declare function exitWithError(message: string): never;
export declare type Target = "ts" | "esm" | "cjs" | "mts" | "deno";
export declare function generateQB(params: {
    outputDir: string;
    connectionConfig: ConnectConfig;
    target: Target;
}): Promise<void>;
