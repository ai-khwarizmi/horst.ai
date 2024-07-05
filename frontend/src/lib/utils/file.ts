import { get } from "svelte/store";
import { edges, nodes, projectName, projectId, viewport, outputData, inputPlaceholderData, resetProject, optionalInputsEnabled } from "$lib";
import { FILE_VERSION } from "./version";
import { registeredNodes } from "@/nodes";
import { NodeType } from "@/types";
import * as LZString from 'lz-string';
import { toast } from "svelte-sonner";
import { isValidEdge, isValidGraph, isValidNode, isValidViewPort } from "./validate";
import type { Edge, Node } from "@xyflow/svelte";
import { generateProjectId } from "./projectId";
import { fullSuperJSON, minimalSuperJSON } from "./horstfile";

const LOCALSTORAGE_KEY_LAST_PROJECT_ID = 'horst.ai.last_project_id';
const LOCALSTORAGE_KEY_SAVEFILES = 'horst.ai.savefiles';
const LOCALSTORAGE_KEY_SAVEFILES_IDS = 'horst.ai.savefiles.ids';

interface SavedGraph {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
    viewport: any;
    data: Record<string, any>;
    inputPlaceholderData: Record<string, any>;
    optionalInputsEnabled: Record<string, Record<string, boolean>>;
    version: string;
}

export function getSaveData(includeData: boolean, includeFileData: boolean = false): {
    graph: SavedGraph;
    stringifiedGraph: string;
} {
    const id = get(projectId);
    const name = get(projectName);
    const n = get(nodes);
    const e = get(edges);
    const v = get(viewport);
    const data: any = {};
    const _inputPlaceholderData: any = {};
    const _optionalInputsEnabled = get(optionalInputsEnabled);

    for (const node of n) {
        if (!node?.type) {
            continue
        }
        if (!registeredNodes[node.type]) {
            continue
        }
        const nodeType = registeredNodes[node.type].nodeType;
        if (includeData && nodeType === NodeType.INPUT) {
            const originalData = get(outputData)[node.id];
            data[node.id] = originalData;
        }
        if (includeData) {
            _inputPlaceholderData[node.id] = get(inputPlaceholderData)[node.id]
        }
    }

    const object: SavedGraph = {
        id,
        name,
        nodes: n,
        edges: e,
        viewport: v,
        data,
        inputPlaceholderData: _inputPlaceholderData,
        optionalInputsEnabled: _optionalInputsEnabled,
        version: FILE_VERSION
    };

    const stringifiedGraph = includeFileData ?
        fullSuperJSON.stringify(object) :
        minimalSuperJSON.stringify(object);

    return {
        graph: object,
        stringifiedGraph
    };
}

export const saveGraphToJson = () => {
    const graph = getSaveData(true, true);

    const name = get(projectName) || 'graph';
    const filename = name.replace(/[^a-z0-9]/gi, '_').toLowerCase().replaceAll('__', '_');

    const blob = new Blob([graph.stringifiedGraph], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = filename + '.horst.json';
    a.href = url;
    a.click();
}

export function getAllLocalProjectIds(): string[] {
    if (typeof window === 'undefined') return [];
    const ids = window.localStorage.getItem(LOCALSTORAGE_KEY_SAVEFILES_IDS);
    if (!ids) return [];
    return JSON.parse(ids);
}

export const saveToLocalStorage = () => {
    if (typeof window === 'undefined') return;
    const graph = getSaveData(true);

    //ensure that graph.id exists  
    if (!graph.graph.id) {
        return;
    }
    const allProjectIds = getAllLocalProjectIds();
    if (graph.graph.nodes?.length === 0 && graph.graph.edges?.length === 0) {
        return;
    }
    if (allProjectIds.length > 0) {
        if (!allProjectIds.includes(graph.graph.id)) {
            allProjectIds.push(graph.graph.id);
            window.localStorage.setItem(LOCALSTORAGE_KEY_SAVEFILES_IDS, JSON.stringify(allProjectIds));
        }
    } else {
        window.localStorage.setItem(LOCALSTORAGE_KEY_SAVEFILES_IDS, JSON.stringify([graph.graph.id]));
    }
    const localStorageKey = LOCALSTORAGE_KEY_SAVEFILES + '.' + graph.graph.id;
    window.localStorage.setItem(localStorageKey, graph.stringifiedGraph);
    window.localStorage.setItem(LOCALSTORAGE_KEY_LAST_PROJECT_ID, graph.graph.id);
}

export const loadFromProjectId = async (projectId: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    const localStorageKey = LOCALSTORAGE_KEY_SAVEFILES + '.' + projectId;
    const str = window.localStorage.getItem(localStorageKey);
    if (!str) return false;
    const graph = minimalSuperJSON.parse<SavedGraph>(str);
    if (!graph) return false;
    return loadFromGraph(graph);
}

export const loadFromHash = (): boolean => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash;
    if (!hash) return false;
    const str = LZString.decompressFromBase64(hash.slice(1));
    if (!str) return false;
    const graph = minimalSuperJSON.parse<SavedGraph>(str);
    window.location.hash = '';
    return loadFromGraph(graph);
}

export const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return false;

    const lastProjectId = window.localStorage.getItem(LOCALSTORAGE_KEY_LAST_PROJECT_ID);
    if (!lastProjectId) return false;

    const localStorageKey = LOCALSTORAGE_KEY_SAVEFILES + '.' + lastProjectId;
    const str = window.localStorage.getItem(localStorageKey);

    if (!str) return false;
    const graph = minimalSuperJSON.parse<SavedGraph>(str);
    return loadFromGraph(graph);
}

export const loadGraphFromUploadedFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        if (!target.files) return alert('no file selected');
        const file = target.files[0];
        await loadFromFile(file);
        toast.success('Project loaded');
    };
    input.click();
}

export const loadFromFile = async (file: File) => {
    const text = await file.text();
    const graph = fullSuperJSON.parse<SavedGraph>(text);
    return loadFromGraph(graph);
}

export const loadFromGraph = (graph: SavedGraph) => {
    resetProject();


    if (graph.version !== FILE_VERSION) {
        toast.error('URL: Version mismatch');
        return false;
    }
    if (!isValidGraph(graph)) {
        toast.error('URL: Invalid project file');
        return false;
    }
    if (!graph.id) {
        graph.id = generateProjectId('local');
    }

    let valid_nodes: Node[] = [];
    let valid_edges: Edge[] = [];

    let invalid_nodes = 0;
    for (const node of graph.nodes) {
        if (!isValidNode(node)) {
            toast.error('URL: Invalid node');
            invalid_nodes++;
            continue;
        }
        valid_nodes.push(node);
    }

    if (invalid_nodes > 0) {
        toast.error(`URL: ${invalid_nodes} invalid nodes`);
    }

    let invalid_edges = 0;
    for (const edge of graph.edges) {
        if (!isValidEdge(edge, valid_nodes)) {
            console.error('invalid edge', edge);
            toast.error('URL: Invalid edge');
            invalid_edges++;
            continue;
        }
        valid_edges.push(edge);
    }

    if (invalid_edges > 0) {
        toast.error(`URL: ${invalid_edges} invalid edges`);
    }

    if (graph.name) {
        projectName.set(graph.name);
    }

    if (graph.data) {
        for (const [id, data] of Object.entries(graph.data)) {
            outputData.update(currentData => ({
                ...currentData,
                [id]: data as Record<string, any>
            }));
        }
    }

    if (graph.inputPlaceholderData) {
        for (const [id, data] of Object.entries(graph.inputPlaceholderData)) {
            inputPlaceholderData.update(currentData => ({
                ...currentData,
                [id]: data as Record<string, any>
            }));
        }
    }

    if (graph.optionalInputsEnabled) {
        optionalInputsEnabled.set(graph.optionalInputsEnabled);
    }

    valid_edges = valid_edges.filter((edge, index, self) =>
        index === self.findIndex((t) => t.id === edge.id)
    );

    valid_nodes = valid_nodes.filter((node, index, self) =>
        index === self.findIndex((t) => t.id === node.id)
    );

    projectId.set(graph.id);
    nodes.set(valid_nodes);
    edges.set(valid_edges);
    if (graph.viewport) {
        if (isValidViewPort(graph.viewport)) {
            viewport.set(graph.viewport);
        } else {
            toast.error('URL: Invalid viewport');
        }
    }

    return true;
}