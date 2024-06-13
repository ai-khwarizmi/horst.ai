import { edges } from "$lib";
import type { Connection, EdgeTypes } from "@xyflow/svelte";
import { get } from "svelte/store";

export const isValidConnection = (connection: any): boolean => {
    if (typeof connection.source !== 'string' || typeof connection.target !== 'string') {
        return false;
    }
    if (typeof connection.sourceHandle !== 'string' || typeof connection.targetHandle !== 'string') {
        return false;
    }
    if (connection.source === connection.target) {
        return false;
    }
    const [sourceType] = connection.sourceHandle.split('-');
    const [targetType] = connection.targetHandle.split('-');
    if (sourceType !== targetType) {
        return false;
    }
    const e = get(edges);
    // check if target already has a connection
    const hasConnection = e.some(edge => {
        console.log(edge, connection)
        return edge.targetHandle === connection.targetHandle && edge.target === connection.target;
    });

    if (hasConnection) {
        return false;
    }
    return true;
}