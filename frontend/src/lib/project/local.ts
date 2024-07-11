import { minimalSuperJSON } from '@/utils/horstfile';
import { getSaveData } from '.';
import type { SaveFileFormat } from '@/types';

const LOCALSTORAGE_SAVE_KEY = 'horst.ai.local.roject';

/*
	do not call this from anywhere but project/index.ts or you risk breaking things
*/
export const _getGraphFromLocalStorage = (): SaveFileFormat | undefined => {
	if (typeof window === 'undefined') return undefined;

	const str = window.localStorage.getItem(LOCALSTORAGE_SAVE_KEY);
	if (!str) return undefined;
	const graph = minimalSuperJSON.parse<SaveFileFormat>(str);
	if (!graph) return undefined;
	return graph;
};

/*
	do not call this from anywhere but project/index.ts or you risk breaking things
*/
export const _saveToLocalStorage = () => {
	if (typeof window === 'undefined') return;
	const graph = getSaveData(true);
	console.log('saving graph to localstorage', graph);

	if (graph.graph.projectType === 'LOCAL') {
		window.localStorage.setItem(LOCALSTORAGE_SAVE_KEY, graph.stringifiedGraph);
	} else {
		throw new Error('Not storing project in localstorage: ' + graph.graph.projectType);
	}
};

export const resetLocalProject = () => {
	console.log('resetting local project');
	window.localStorage.removeItem(LOCALSTORAGE_SAVE_KEY);
};
