import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const customRules = {
	'enforce-wrap-in-onexecute': {
		meta: {
			type: 'problem',
			docs: {
				description: 'Enforce use of wrap() for all awaits in onExecute() functions'
			},
			schema: [],
			messages: {
				missingWrap: 'All await expressions in onExecute must be wrapped in a wrap() function.'
			}
		},
		create(context) {
			return {
				'Property[key.name="onExecute"] > ArrowFunctionExpression, VariableDeclarator[id.name="onExecute"] > ArrowFunctionExpression'(
					node
				) {
					const sourceCode = context.getSourceCode();
					const functionCode = sourceCode.getText(node.body);

					const awaitRegex = /await\s+(?:wrap\s*\()?\s*[\w.]+\s*\([^)]*\)/g;
					const allAwaits = [];
					let match;
					while ((match = awaitRegex.exec(functionCode)) !== null) {
						allAwaits.push({
							expression: match[0],
							index: match.index
						});
					}

					allAwaits.forEach(({ expression, index }) => {
						if (!expression.includes('wrap(')) {
							const loc = sourceCode.getLocFromIndex(node.body.range[0] + index);
							context.report({
								node,
								message: `All await expressions in onExecute must be wrapped in _wrap(). Found: ${expression}`,
								loc: loc
							});
						}
					});
				}
			};
		}
	}
};

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'custom/enforce-wrap-in-onexecute': 'error'
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'src/lib/components/ui/**', 'static']
	},
	{
		plugins: {
			custom: {
				rules: customRules
			}
		}
	}
];
