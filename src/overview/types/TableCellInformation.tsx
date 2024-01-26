import {NodeInformation} from "../../nodes/types/NodeInformation.ts";

export interface TableCellInformation {
    node : NodeInformation,
    entry : string,
    min : number,
    max : number,
}