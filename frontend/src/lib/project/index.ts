import { isValidEdge, isValidGraph, isValidNode, isValidViewPort } from "@/utils/validate";
import { FILE_VERSION } from "@/utils/version";
import type { Edge, Node } from "@xyflow/svelte";
import { toast } from "svelte-sonner";
import { edges, inputData, inputDataWithoutPlaceholder, inputPlaceholderData, nodes, optionalInputsEnabled, outputData, projectId, projectName, resetHandlers, updatedAt, viewport } from "..";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { getGraphFromLocalProject, removeProjectFromLocalStorage, removeSaveFileId, resetLastProjectId, saveToLocalStorage } from "./local";
import { connectToCloud } from "./cloud";
import { browser } from "$app/environment";
import { registeredNodes } from "@/nodes";
import { NodeType } from "@/types";
import { fullSuperJSON, minimalSuperJSON } from "@/utils/horstfile";
import { generateProjectId } from "@/utils/projectId";

export interface SavedGraph {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
    viewport: any;
    data: Record<string, any>;
    inputPlaceholderData: Record<string, any>;
    optionalInputsEnabled: Record<string, Record<string, boolean>>;
    updatedAt: number;
    version: string;
}


export function getSaveData(includeData: boolean, includeFileData: boolean = false): {
    graph: SavedGraph;
    stringifiedGraph: string;
} {
    let id = get(projectId);
    if (!id) {
        id = generateProjectId('local');
        projectId.set(id);
    }
    const name = get(projectName);
    const n = get(nodes);
    const e = get(edges);
    const v = get(viewport);
    const _updatedAt = get(updatedAt);
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
        updatedAt: _updatedAt,
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

let loading = false;

export const loadProjectByProjectId = async (_projectId: string): Promise<void> => {
    const activeProjectId = get(projectId);
    if (activeProjectId && activeProjectId === _projectId) {
        return;
    }
    if (loading) {
        return;
    }
    loading = true;
    try {
        if (_projectId.startsWith('local-')) {
            const graph = getGraphFromLocalProject(_projectId);
            if (!graph) {
                removeSaveFileId(_projectId);
                toast.error('Project not found: ' + _projectId);
                goto('/');
            }
            else loadFromGraph(graph);
        } else {
            await connectToCloud(_projectId);
        }
    } catch (err) {
        toast.error('Failed to load project');
    }
    loading = false;
}

export const loadFromGraph = (graph: SavedGraph) => {
    if (graph.version !== FILE_VERSION) {
        toast.error('Graph: Version mismatch');
        return false;
    }
    if (!isValidGraph(graph)) {
        toast.error('Graph: Invalid project file');
        return false;
    }

    let valid_nodes: Node[] = [];
    let valid_edges: Edge[] = [];

    let invalid_nodes = 0;
    for (const node of graph.nodes) {
        if (!isValidNode(node)) {
            toast.error('Graph: Invalid node');
            invalid_nodes++;
            continue;
        }
        valid_nodes.push(node);
    }

    if (invalid_nodes > 0) {
        toast.error(`Graph: ${invalid_nodes} invalid nodes`);
    }

    let invalid_edges = 0;
    for (const edge of graph.edges) {
        if (!isValidEdge(edge, valid_nodes)) {
            toast.error('Graph: Invalid edge');
            invalid_edges++;
            continue;
        }
        valid_edges.push(edge);
    }

    if (invalid_edges > 0) {
        toast.error(`Graph: ${invalid_edges} invalid edges`);
    }

    projectId.set(graph.id);
    projectName.set(graph.name ?? '');
    updatedAt.set(graph.updatedAt ?? Date.now());

    outputData.set(graph.data ?? {});
    inputPlaceholderData.set(graph.inputPlaceholderData ?? {});
    optionalInputsEnabled.set(graph.optionalInputsEnabled ?? {});

    valid_edges = valid_edges.filter((edge, index, self) =>
        index === self.findIndex((t) => t.id === edge.id)
    );

    valid_nodes = valid_nodes.filter((node, index, self) =>
        index === self.findIndex((t) => t.id === node.id)
    );

    nodes.set(valid_nodes);
    edges.set(valid_edges);
    if (graph.viewport && isValidViewPort(graph.viewport)) {
        viewport.set(graph.viewport);
    } else {
        viewport.set({ x: 0, y: 0, zoom: 1 });
    }

    return true;
}

export function deleteCurrentProject() {
    const _projectId = get(projectId);
    if (!_projectId) return;
    resetProject();
    goto('/');
    if (_projectId.startsWith('local-')) {
        removeProjectFromLocalStorage(_projectId);
    }
}

export const resetProject = (redirect = true) => {
    projectId.set(undefined);
    nodes.set([]);
    edges.set([]);
    projectName.set('');
    updatedAt.set(0);
    viewport.set({ x: 0, y: 0, zoom: 1 });
    outputData.set({});
    inputPlaceholderData.set({});
    inputData.set({});
    inputDataWithoutPlaceholder.set({});
    optionalInputsEnabled.set({});
    resetLastProjectId();
    resetHandlers();
    if (redirect) goto('/');
}

export function createNewProject() {
    const _projectId = generateProjectId('local');
    projectId.set(_projectId);
    projectName.set('');
    updatedAt.set(0);
    viewport.set({ x: 0, y: 0, zoom: 1 });
    outputData.set({});
    inputPlaceholderData.set({});
    inputData.set({});
    inputDataWithoutPlaceholder.set({});
    optionalInputsEnabled.set({});
    nodes.set([]);
    edges.set([]);
    saveToLocalStorage();
    resetHandlers();
    goto(`/project/${_projectId}`);
    return _projectId;
}

export const handleProjectChange = () => {
    const _projectId = get(projectId);
    if (!_projectId) {
        const _nodes = get(nodes);
        if (_nodes.length === 0) return;
        const _newProjectId = generateProjectId('local');
        projectId.set(_newProjectId);
        saveToLocalStorage()
        goto(`/project/${_newProjectId}`);
        return
    }

    if (_projectId.startsWith('local-')) {
        updatedAt.set(Date.now());
        saveToLocalStorage()
    } else {
        // This is done at an interval
        // cloudSaveCurrentProject();
    }
}

export const handleProjectIdChange = (projectId: string | undefined) => {
    if (!browser) return;
    if (!projectId || projectId.length < 3) return;

    const _nodes = get(nodes);
    if (_nodes.length === 0) return;

    let targetPath = `/project/${projectId}/`;
    const currentPath = window.location.pathname;

    if (currentPath === targetPath) return;

    goto(targetPath, { replaceState: true });
}
