export enum NodeType {
    INPUT = 'input',
    VIEWER = 'viewer',
    TRANSFORM = 'transform',
    FUNCTION = 'function',
    UNKNOWN = 'unknown'
}

export type NodeValueType = 'text' | 'number' | 'boolean'

// may this is useful for validating the input/output of the nodes
// TODO maybe dont throw an error
function convert<T extends NodeValueType>(data: unknown, type: T): T extends 'text' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean : any {
    switch (type) {
        case 'text':
            if (typeof data === 'string') {
                return data as any
            }
            throw new Error('Invalid type. Expected a string.');
        case 'number':
            if (typeof data === 'number') {
                return data as any
            }
            throw new Error('Invalid type. Expected a number.');
        case 'boolean':
            if (typeof data === 'boolean') {
                return data as any
            }
            throw new Error('Invalid type. Expected a boolean.');
        default:
            return data as any;
    }
}

export const SPECIAL_ERRORS = {
    'OPENAI_API_KEY_MISSING': 'OPENAI_API_KEY_MISSING',
}

export type NodeError = string | {
    message: string;
    resolve?: () => void;
}
export type NodeStatusWithoutError = 'idle' | 'loading' | 'success';
export type NodeStatus = NodeStatusWithoutError | 'error';
export type OnExecuteCallbacks = {
    setStatus: (newStatus: NodeStatusWithoutError) => void;
    setErrors: (newErrors: NodeError[]) => void;
};


/**
 * Node I/O
 * id - unique id of the output, stays relevant for project file, if changed, the project file will be invalid
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
