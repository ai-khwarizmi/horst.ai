export enum NodeType {
    INPUT = 'input',
    VIEWER = 'viewer',
    TRANSFORM = 'transform',
    FUNCTION = 'function',
    DEFAULT = 'default'
}

export type NodeValueType = 'any' | 'text' | 'number'

/**
 * Node I/O
 * id - unique id of the output, stays relevant for graph file, if changed, the graph file will be invalid
 * type - type of the output, used for validation
 * label - label of the output, used for display
 */

type BaseIO<TNodeID extends string> = {
    id: TNodeID;
    type: NodeValueType;
    label?: string;
}

export type Input<TNodeID extends string> = BaseIO<TNodeID>
export type Output<TNodeID extends string> = BaseIO<TNodeID>