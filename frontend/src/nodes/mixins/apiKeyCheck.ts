import { getApiKeys, ApiKeys } from "../../utils";

export function checkApiKeyPresent(node: any, key: keyof ApiKeys): boolean {
	const apiKeys = getApiKeys();
	if (!apiKeys[key]) {
		node.has_errors = true;
		if (!node.defaultTitle) {
			node.defaultTitle = node.title.replace(' [SET API KEY]', '');
		}
		node.title = `${node.defaultTitle} [SET API KEY] `;
		return false;
	} else if (node.title !== node.defaultTitle) {
		node.has_errors = false;
		node.title = node.defaultTitle;
	}
	return true;
}