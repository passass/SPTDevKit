// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import electron from "vite-plugin-electron";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
	const isElectron = mode === "electron";

	const plugins = [
		vue(),
		vueDevTools(),
		vueJsx({
			// Опции для JSX
			transformOn: true,
			mergeProps: true,
			// Включаем поддержку TypeScript
			include: /\.[jt]sx$/,
			exclude: /node_modules/,
			babelPlugins: [
				["@babel/plugin-proposal-decorators", { version: "legacy" }],
				["@babel/plugin-proposal-class-properties", { loose: true }],
			],
		}),
	];

	if (isElectron) {
		plugins.push(
			electron({
				entry: "src/background.js", // или src/background.js
				vite: {
					build: {
						outDir: "dist-electron",
						rollupOptions: {
							external: ["electron"],
						},
					},
				},
			}),
		);
	}

	return {
		plugins,
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
				"@data": fileURLToPath(new URL("./data", import.meta.url)),
			},
		},
		// Для Electron нужно указывать base
		base: "./",
		build: {
			outDir: isElectron ? "dist-electron" : "dist",
			emptyOutDir: true,
		},
	};
});

import AutoImport from "unplugin-auto-import/vite";
