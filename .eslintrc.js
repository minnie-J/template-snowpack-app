module.exports = {
	env: {
		browser: true,
		node: true,
		es2021: true,
	},
	// globals: {
	//   window: true,
	//   module: true,
	// },
	extends: [
		"eslint:recommended",
		"plugin:react/recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:jsx-a11y/recommended",
		"plugin:prettier/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: "module",
	},
	plugins: ["react", "@typescript-eslint", "react-hooks", "prettier"],
	/**
	 * "off" or 0 - turn the rule off
	 * "warn" or 1 - turn the rule on as a warning (doesn't affect exit code)
	 * "error" or 2 - turn the rule on as an error (exit code is 1 when triggered)
	 */
	rules: {
		// 'import React'하지 않았을 때 에러 처리
		"react/react-in-jsx-scope": "off",
		// allow jsx syntax in js files (for next.js project)
		"react/jsx-filename-extension": [
			"warn",
			{ extensions: [".js", ".jsx", ".ts", "tsx"] },
		],
		// 함수의 리턴 타입 정의하지 않았을 때 에러 처리
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"prettier/prettier": "error",
	},
	// 꼭 필요한 것 같지 않음
	// settings: {
	//   react: {
	//     version: "detect",
	//   },
	// },
};
