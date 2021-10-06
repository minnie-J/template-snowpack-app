/** @type {import("snowpack").SnowpackUserConfig } */
const pluginList = [
	"@snowpack/plugin-react-refresh",
	"@snowpack/plugin-dotenv",
	"@snowpack/plugin-babel",
	[
		"@snowpack/plugin-typescript",
		{
			/* Yarn PnP workaround: see https://www.npmjs.com/package/@snowpack/plugin-typescript */
			...(process.versions.pnp ? { tsc: "yarn pnpify tsc" } : {}),
		},
	],
];

export default {
	mount: {
		public: { url: "/", static: true },
		src: { url: "/dist" },
	},
	plugins:
		process.env.NODE_ENV === "production"
			? [...pluginList, "@snowpack/plugin-webpack"]
			: pluginList,
	routes: [
		/* Enable an SPA Fallback in development: */
		// {"match": "routes", "src": ".*", "dest": "/index.html"},
	],
	optimize: {
		/* Example: Bundle your final build: */
		// "bundle": true,
	},
	packageOptions: {
		knownEntrypoints: ["react/jsx-runtime"],
		packageExportLookupFields: ["antd"],
	},
	devOptions: {
		port: 3000,
		// open 안먹는다
		// open: "chrome",
	},
	buildOptions: {
		/* ... */
	},
};
