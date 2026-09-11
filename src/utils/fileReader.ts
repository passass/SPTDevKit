import { isElectron } from "./utils";
import { parse } from "jsonc-parser";

/**
 * Читает локальный JSON в любом окружении
 * @param {string} filename — имя файла, например 'items.json'
 * @returns {Promise<any>}
 */
export async function readLocalJson(filename: string) {
	// Electron (production + dev)
	if (isElectron()) {
		const result = await window.electronAPI.readLocalJson(filename);
		if (!result.success) {
			throw new Error(
				`[${filename}] ${result.error}\nPath: ${result.path}`,
			);
		}
		return result.data;
	}

	// Fallback: обычный fetch (если файл в public/data/)
	const res = await fetch(`/data/${filename}`);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

export async function readJson(filepath: string) {
	// Electron (production + dev)
	if (window.electronAPI?.readFile) {
		const result = await window.electronAPI.readFile(filepath);
		if (!result.success) {
			throw new Error(
				`[${filepath}] ${result.error}\nPath: ${result.path}`,
			);
		}

		//const jsonString: string = result.data.toString('utf-8');
		const decoder = new TextDecoder('utf-8');
		const jsonString = decoder.decode(result.data);
		for (const jsonParser of [JSON.parse, parse]) {
			try {
				const data = jsonParser(jsonString);
				return data;
			} catch {
				continue;
			}
		}

		return undefined;
	}

	throw new Error(`readJson is not supported in non electron enviroment`);
}

/**
 * Записывает локальный JSON (только Electron)
 */
export async function writeLocalJson(
	filename: string,
	data: object | Array<any>,
) {
	if (!window.electronAPI?.writeLocalJson) {
		throw new Error("Запись доступна только в Electron");
	}
	const result = await window.electronAPI.writeLocalJson(filename, data);
	if (!result.success) throw new Error(result.error);
}
