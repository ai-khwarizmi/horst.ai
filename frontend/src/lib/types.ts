export enum NodeType {
    INPUT = 'input',
    VIEWER = 'viewer',
    TRANSFORM = 'transform',
    FUNCTION = 'function',
    UNKNOWN = 'unknown'
}

type RawNodeValueType = 'text' | 'number' | 'boolean' | 'any' | 'json' | 'array' | 'file' | 'file[]';
type ArrayNodeValueType = `${RawNodeValueType}[]`;
export type NodeValueType = RawNodeValueType | ArrayNodeValueType;

export type NodeValueTypeConverted<T extends NodeValueType> = (
    T extends ArrayNodeValueType ? (
        T extends 'text[]' ? string[] :
        T extends 'number[]' ? number[] :
        T extends 'boolean[]' ? boolean[] :
        any[]
    ) : (
        T extends 'text' ? string :
        T extends 'number' ? number :
        T extends 'boolean' ? boolean :
        any
    )
)

type SuccessValidationResult<T> = {
    success: true;
    value: T;
};
type ValidationResult<T> = SuccessValidationResult<T> | {
    success: false;
    error: string;
};

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

// may this is useful for validating the input/output of the nodes
// TODO maybe dont throw an error
export function validateNodeValue<T extends NodeValueType>(data: unknown, type: T): ValidationResult<NodeValueTypeConverted<T>> {
    if (type.endsWith('[]')) {
        if (!isArray(data)) {
            return { success: false, error: 'Invalid type. Expected an array.' };
        }
        const elementType = type.slice(0, -2) as RawNodeValueType;
        const validatedArray = data.map(element => validateNodeValue(element, elementType));
        if (validatedArray.every(result => result.success)) {
            return { success: true, value: validatedArray.map(result => (result as SuccessValidationResult<T>).value) as NodeValueTypeConverted<T> };
        } else {
            return { success: false, error: 'Invalid array element type.' };
        }
    }

    switch (type) {
        case 'text':
            if (isString(data)) {
                return { success: true, value: data as NodeValueTypeConverted<T> };
            }
            return { success: false, error: 'Invalid type. Expected a string.' };
        case 'number':
            if (isNumber(data)) {
                return { success: true, value: data as NodeValueTypeConverted<T> };
            }
            return { success: false, error: 'Invalid type. Expected a number.' };
        case 'boolean':
            if (isBoolean(data)) {
                return { success: true, value: data as NodeValueTypeConverted<T> };
            }
            return { success: false, error: 'Invalid type. Expected a boolean.' };
        default:
            return { success: true, value: data as NodeValueTypeConverted<T> };
    }
}

export type ConnectWith = {
    id: string;
    handle: string;
    type: 'input' | 'output';
}

export const SPECIAL_ERRORS = {
    'OPENAI_API_KEY_MISSING': 'OPENAI_API_KEY_MISSING',
    'ANTHROPIC_API_KEY_MISSING': 'ANTHROPIC_API_KEY_MISSING',
    'LEONARDO_API_KEY_MISSING': 'LEONARDO_API_KEY_MISSING'
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
    optional?: boolean;
}

type InputOptionInputField = {
    inputOptionType: 'input-field';
    default: undefined | any;
}
type InputOptionDropdown = {
    inputOptionType: 'dropdown';
    options: any[];
    default: undefined | any;
}

type InputOption = InputOptionInputField | InputOptionDropdown;

export function basicInputOptionInput(): InputOptionInputField {
    return {
        inputOptionType: 'input-field',
        default: undefined
    }
}
export type Input<TNodeID extends string> = BaseIO<TNodeID> & {
    input?: InputOption;
}
export type Output<TNodeID extends string> = BaseIO<TNodeID>
