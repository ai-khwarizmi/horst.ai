export type NodeValueType = 'string' | 'number'

export type Input = {
    type: NodeValueType;
    label?: string;
}

export type Output = {
    type: NodeValueType;
    label?: string;
}