import { get } from "svelte/store";
import { edges, nodes, projectName, projectId, viewport } from "$lib";
import { FILE_VERSION } from "./version";
import { registeredNodes } from "@/nodes";
import { NodeType } from "@/types";
import * as LZString from 'lz-string';
import { toast } from "svelte-sonner";
import { isValidEdge, isValidGraph, isValidNode, isValidViewPort } from "./validate";
import type { Edge, Node } from "@xyflow/svelte";
import { outputData } from "@/utils";
import { generateProjectId } from "./projectId";


const LOCALSTORAGE_KEY_LAST_PROJECT_ID = 'horst.ai.last_project_id';
const LOCALSTORAGE_KEY_SAVEFILES = 'horst.ai.savefiles';
const LOCALSTORAGE_KEY_SAVEFILES_IDS = 'horst.ai.savefiles.ids';

export function getSaveData(includeData: boolean): {
    id: string, projectName: string, nodes: any; edges: any, version: number, viewport: any
} {
    const id = get(projectId);
    const name = get(projectName);
    const n = get(nodes);
    const e = get(edges);
    const v = get(viewport);
    const data: any = {};

    for (const node of n) {
        if (!node?.type) {
            console.error('node is ', node);
            continue
        }
        if (!registeredNodes[node.type]) {
            console.error('node type not registered', node.type);
            continue
        }
        const nodeType = registeredNodes[node.type].nodeType;
        if (includeData && nodeType === NodeType.INPUT) {
            data[node.id] = outputData[node.id]
        }
    }

    const json = JSON.parse(JSON.stringify({
        id,
        name,
        nodes: n,
        edges: e,
        viewport: v,
        data,
        version: FILE_VERSION
    }));

    return json;
}

export const saveGraph = () => {
    const graph = getSaveData(true);

    const name = get(projectName) || 'graph';
    const filename = name.replace(/[^a-z0-9]/gi, '_').toLowerCase().replaceAll('__', '_');

    const str = JSON.stringify(graph, null, 4);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = filename + '.json';
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
    if (!graph.id) {
        throw new Error('graph.id is missing');
    }
    const allProjectIds = getAllLocalProjectIds();
    const str = JSON.stringify(graph);
    if (allProjectIds.length > 0) {
        if (!allProjectIds.includes(graph.id)) {
            allProjectIds.push(graph.id);
            window.localStorage.setItem(LOCALSTORAGE_KEY_SAVEFILES_IDS, JSON.stringify(allProjectIds));
        }
    } else {
        window.localStorage.setItem(LOCALSTORAGE_KEY_SAVEFILES_IDS, JSON.stringify([graph.id]));
    }
    const localStorageKey = LOCALSTORAGE_KEY_SAVEFILES + '.' + graph.id;
    window.localStorage.setItem(localStorageKey, str);
    window.localStorage.setItem(LOCALSTORAGE_KEY_LAST_PROJECT_ID, graph.id);
}

export const loadFromHash = (): boolean => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash;
    if (!hash) return false;
    const str = LZString.decompressFromBase64(hash.slice(1));
    if (!str) return false;
    const graph = JSON.parse(str);
    return loadFromGraph(graph);
}

export const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return;

    const lastProjectId = window.localStorage.getItem(LOCALSTORAGE_KEY_LAST_PROJECT_ID);
    if (!lastProjectId) return;

    const localStorageKey = LOCALSTORAGE_KEY_SAVEFILES + '.' + lastProjectId;
    const str = window.localStorage.getItem(localStorageKey);

    if (!str) return;
    const graph = JSON.parse(str);
    return loadFromGraph(graph);
}

export const resetGraph = () => {
    window.location.hash = '';
    projectId.set(generateProjectId('clt'));
    projectName.set('');
    nodes.set([]);
    edges.set([]);
    viewport.set({ x: 0, y: 0, zoom: 1 });
}

export const loadGraph = async () => {
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
    const graph = JSON.parse(text);
    return loadFromGraph(graph);
}

export const loadFromGraph = (graph: any) => {
    if (graph.version !== FILE_VERSION) {
        // TODO: migrate graph to newest version
        toast.error('URL: Version mismatch');
        return false;
    }
    if (!isValidGraph(graph)) {
        toast.error('URL: Invalid project file');
        return false;
    }
    if (!graph.id) {
        graph.id = generateProjectId('clt');
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
            outputData[id] = data as Record<string, any>;
        }
    }

    // remove duplicate nodes (by id)
    valid_edges = valid_edges.filter((edge, index, self) =>
        index === self.findIndex((t) => t.id === edge.id)
    );
    // remove duplicate edges (by id)
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