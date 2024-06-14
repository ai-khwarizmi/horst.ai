export type NodeValueType = 'any' | 'text' | 'number'

export type Input = {
    type: NodeValueType;
    label?: string;
}

export type Output = {
    type: NodeValueType;
    label?: string;
}