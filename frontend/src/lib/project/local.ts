import { minimalSuperJSON } from '@/utils/horstfile';
import { getSaveData } from '.';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { SaveFileFormat } from '@/types';

const LOCALSTORAGE_KEY_LAST_PROJECT_ID = 'horst.ai.last_project_id';
const LOCALSTORAGE_KEY_SAVEFILES = 'horst.ai.savefiles';
const LOCALSTORAGE_KEY_SAVEFILES_IDS = 'horst.ai.savefiles.ids';

export const localProjectIds = writable<string[]>([]);

if (browser) getAllLocalProjectIds();

export const getGraphFromLocalProject = (projectId: string): SaveFileFormat | undefined => {
	if (typeof window === 'undefined') return undefined;
	const localStorageKey = LOCALSTORAGE_KEY_SAVEFILES + '.' + projectId;
	const str = window.localStorage.getItem(localStorageKey);
	if (!str) return undefined;
	const graph = minimalSuperJSON.parse<SaveFileFormat>(str);
	if (!graph) return undefined;
	return graph;
};

export const saveToLocalStorage = () => {
	if (typeof window === 'undefined') return;
	const graph = getSaveData(true);

	if (graph.graph.nodes?.length === 0 && graph.graph.edges?.length === 0) {
		return;
	}

	addSaveFileId(graph.graph.projectId);
	const localStorageKey = LOCALSTORAGE_KEY_SAVEFILES + '.' + graph.graph.projectId;
	window.localStorage.setItem(localStorageKey, graph.stringifiedGraph);
	window.localStorage.setItem(LOCALSTORAGE_KEY_LAST_PROJECT_ID, graph.graph.projectId);
	addSaveFileId(graph.graph.projectId);
};

export const addSaveFileId = (projectId: string) => {
	if (typeof window === 'undefined') return;
	const allProjectIds = getAllLocalProjectIds();
	if (allProjectIds.length > 0) {
		if (!allProjectIds.includes(projectId)) {
			allProjectIds.push(projectId);
			window.localStorage.setItem(LOCALSTORAGE_KEY_SAVEFILES_IDS, JSON.stringify(allProjectIds));
		}
	} else {
		window.localStorage.setItem(LOCALSTORAGE_KEY_SAVEFILES_IDS, JSON.stringify([projectId]));
	}
};

export const removeProjectFromLocalStorage = (projectId: string) => {
	if (typeof window === 'undefined') return;
	const localStorageKey = LOCALSTORAGE_KEY_SAVEFILES + '.' + projectId;
	window.localStorage.removeItem(localStorageKey);
	removeSaveFileId(projectId);
	getAllLocalProjectIds();
};

export const removeSaveFileId = (projectId: string) => {
	if (typeof window === 'undefined') return;
	const allProjectIds = getAllLocalProjectIds();
	const newProjectIds = allProjectIds.filter((id) => id !== projectId);
	window.localStorage.setItem(LOCALSTORAGE_KEY_SAVEFILES_IDS, JSON.stringify(newProjectIds));
};

export const resetLastProjectId = () => {
	if (typeof window === 'undefined') return;
	window.localStorage.removeItem(LOCALSTORAGE_KEY_LAST_PROJECT_ID);
};

function getAllLocalProjectIds(): string[] {
	if (typeof window === 'undefined') return [];
	const ids = window.localStorage.getItem(LOCALSTORAGE_KEY_SAVEFILES_IDS);
	localProjectIds.set(ids ? JSON.parse(ids) : []);
	if (!ids) return [];
	return JSON.parse(ids);
}

export function getLastLocalProjectId(): string | undefined {
	if (typeof window === 'undefined') return undefined;
	return window.localStorage.getItem(LOCALSTORAGE_KEY_LAST_PROJECT_ID) || undefined;
}
