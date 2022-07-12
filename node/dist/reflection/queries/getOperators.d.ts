import { Executor } from "../../ifaces";
import { StrictMap } from "../strictMap";
import { Param, Typemod } from "./getFunctions";
import { typeutil } from "../util/util";
import { OperatorKind } from "../enums";
export type { Typemod };
export interface OperatorDef {
    id: string;
    name: string;
    originalName: string;
    operator_kind: OperatorKind;
    description?: string;
    return_type: {
        id: string;
        name: string;
    };
    return_typemod: Typemod;
    params: Param[];
}
export declare type OperatorTypes = typeutil.depromisify<ReturnType<typeof getOperators>>;
export declare const getOperators: (cxn: Executor) => Promise<StrictMap<string, OperatorDef[]>>;
