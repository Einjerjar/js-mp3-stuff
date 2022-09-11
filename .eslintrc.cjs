module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	plugins: ['@typescript-eslint'],
	ignorePatterns: ['*.cjs'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'quote-props': ['error', 'consistent'],
    'comma-dangle': ['error', 'only-multiline'],
    'no-extra-parens': ['error', 'all'],
    'no-template-curly-in-string': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'always'],
    'no-non-null-assertion': 'off',
    'no-extra-parens': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
  },
};
