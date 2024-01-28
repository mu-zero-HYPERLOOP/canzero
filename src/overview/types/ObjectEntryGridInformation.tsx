import {NodeInformation} from "../../nodes/types/NodeInformation.ts";

export interface ObjectEntryGridInformation {
    node : NodeInformation,
    entry : string,
    min? : number,
    max? : number,
}