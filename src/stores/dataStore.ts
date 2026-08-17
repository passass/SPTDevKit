// src/stores/dataStore.ts

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useFileDataStore } from "./fileStore";
import { QuestSchema } from "@/types/fields/fieldsQuests";
import type { RecordSchema, SchemaData } from "@/types/fields/fields";
import type { ClassType } from "@/utils/classUtils";

export interface DataStoreConfig {
	filename: string | string[];
	schemaType?: ClassType<RecordSchema>;
}
export type dataStoreType<T = any> = Map<string, T>

export const useDataStore = defineStore("dataStore", () => {
	const fileStore = useFileDataStore();
	
	// Хранилище для всех данных: ключ -> Map<string, данные>
	const dataMap = ref<Map<string, dataStoreType>>(new Map());
	
	// Конфигурации для каждого ключа
	const configs = ref<Map<string, DataStoreConfig>>(new Map());
	
	// Статусы загрузки для каждого ключа
	const loadingStatus = ref<Map<string, boolean>>(new Map());
	const errorStatus = ref<Map<string, string | null>>(new Map());

	// Регистрация хранилища
	function register(key: string, config: DataStoreConfig) {
		if (!dataMap.value.has(key)) {
			dataMap.value.set(key, new Map());
			configs.value.set(key, config);
			loadingStatus.value.set(key, false);
			errorStatus.value.set(key, null);
		}
	}

	// Регистрация нескольких хранилищ
	function registerMultiple(configs: Record<string, DataStoreConfig>) {
		for (const [key, config] of Object.entries(configs)) {
			register(key, config);
		}
	}

	// Загрузка данных из одного или нескольких файлов
	async function load(key: string) {
		const config = configs.value.get(key);
		if (!config) {
			throw new Error(`Store "${key}" not registered`);
		}

		loadingStatus.value.set(key, true);
		errorStatus.value.set(key, null);

		try {
			const filenames = Array.isArray(config.filename) ? config.filename : [config.filename];
			const store = dataMap.value.get(key)!;
			store.clear();

			const schemaType = config.schemaType;

			for (const filename of filenames) {
				const fileData = await fileStore.read(filename);
				const fileContent = fileData.data ?? fileData

				if (fileContent && typeof fileContent === "object") {
					for (const [id, itemData] of Object.entries(fileContent)) {
						if (!store.has(id)) {
							let value: any;
							if (schemaType && itemData && typeof itemData === "object") {
								value = new schemaType(itemData);
							} else {
								value = itemData;
							}
							store.set(id, value);
						} else {
							console.warn(`Duplicate ID "${id}" found in file "${filename}", skipping...`);
						}
					}
				}
			}
		} catch (err: any) {
			errorStatus.value.set(key, err.message);
			throw err;
		} finally {
			loadingStatus.value.set(key, false);
		}
	}

	// Загрузка нескольких хранилищ
	async function loadMultiple(keys: string[]) {
		const promises = keys.map(key => load(key));
		await Promise.all(promises);
	}

	// Загрузка всех зарегистрированных хранилищ
	async function loadAll() {
		const keys = Array.from(configs.value.keys());
		await loadMultiple(keys);
	}

	// Перезагрузка
	async function reload(key: string) {
		const config = configs.value.get(key);
		if (!config) {
			throw new Error(`Store "${key}" not registered`);
		}
		
		const filenames = Array.isArray(config.filename) ? config.filename : [config.filename];
		for (const filename of filenames) {
			await fileStore.reload(filename);
		}
		await load(key);
	}

	// Перезагрузка нескольких
	async function reloadMultiple(keys: string[]) {
		const promises = keys.map(key => reload(key));
		await Promise.all(promises);
	}

	// Получить весь Map
	function getMap<T = any>(key: string): dataStoreType<T> {
		const store = dataMap.value.get(key);
		if (!store) {
			throw new Error(`Store "${key}" not found`);
		}
		return store as dataStoreType<T>;
	}

	// Получить список всех значений
	function getList<T = any>(key: string): T[] {
		return Array.from(getMap<T>(key).values());
	}

	// Получить список ID
	function getIds(key: string): string[] {
		return Array.from(getMap(key).keys());
	}

	// Получить количество записей
	function getCount(key: string): number {
		return getMap(key).size;
	}

	// Получить один элемент
	function get<T = any>(key: string, id: string): T | undefined {
		return getMap<T>(key).get(id);
	}

	function safeGet<T = any>(key: string | string[], id: string): T | undefined;
	function safeGet<T = any>(key: string | string[], id: string, def: T): T;
	function safeGet<T = any>(key: string | string[], id: string, def?: T): T | undefined {
		if (Array.isArray(key)) {
			for (const _key of key) {
				const res = safeGet<T>(_key, id);
				if (res !== undefined) {
					return res;
				}
			}
			return def;
		}

		const store = dataMap.value?.get?.(key);
		const value = store?.get(id) as T | undefined;
		return value ?? def;
	}

	// Установить элемент
	function set<T = any>(key: string, id: string, data: T) {
		getMap(key).set(id, data);
	}

	// Добавить элемент
	function add<T = any>(key: string, id: string, data: T): T {
		getMap(key).set(id, data);
		return data;
	}

	// Удалить элемент
	function remove(key: string, id: string): boolean {
		return getMap(key).delete(id);
	}

	// Очистить все данные по ключу
	function clear(key: string) {
		getMap(key).clear();
	}

	// Сохранить в файл(ы)
	async function save(key: string) {
		const config = configs.value.get(key);
		if (!config) {
			throw new Error(`Store "${key}" not registered`);
		}

		const store = getMap(key);
		const filenames = Array.isArray(config.filename) ? config.filename : [config.filename];
		
		// Если несколько файлов, сохраняем в первый
		const filename = filenames[0];
		
		const result: Record<string, any> = {};
		for (const [id, data] of store) {
			if (data && typeof data === "object" && 'toJSON' in data && typeof data.toJSON === 'function') {
				result[id] = data.toJSON();
			} else {
				result[id] = data;
			}
		}
		
		await fileStore.write(filename, result);
	}

	// Сохранить несколько
	async function saveMultiple(keys: string[]) {
		const promises = keys.map(key => save(key));
		await Promise.all(promises);
	}

	// Сохранить все
	async function saveAll() {
		const keys = Array.from(configs.value.keys());
		await saveMultiple(keys);
	}

	// Проверить, загружены ли данные
	function isLoaded(key: string): boolean {
		const status = loadingStatus.value.get(key);
		return status === false && errorStatus.value.get(key) === null;
	}

	// Проверить, загружены ли все
	function isAllLoaded(): boolean {
		const keys = Array.from(configs.value.keys());
		return keys.every(key => isLoaded(key));
	}

	// Получить ошибку
	function getError(key: string): string | null {
		return errorStatus.value.get(key) || null;
	}

	// Создать новый элемент
	function create<T = any>(key: string, data: any): T {
		const config = configs.value.get(key);
		if (!config) {
			throw new Error(`Store "${key}" not registered`);
		}

		const store = getMap<T>(key);
		const id = data._id || data.id || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
		
		let value: any;
		if (config.schemaType) {
			value = new config.schemaType(data);
		} else {
			value = data;
		}
		
		store.set(id, value);
		return value;
	}

	// Получить все зарегистрированные ключи
	function getKeys(): string[] {
		return Array.from(configs.value.keys());
	}

	// Получить имена файлов для ключа
	function getFilenames(key: string): string[] {
		const config = configs.value.get(key);
		if (!config) {
			return [];
		}
		return Array.isArray(config.filename) ? config.filename : [config.filename];
	}

	return {
		dataMap,
		configs,
		loadingStatus,
		errorStatus,
		register,
		registerMultiple,
		load,
		loadMultiple,
		loadAll,
		reload,
		reloadMultiple,
		getMap,
		getList,
		getIds,
		getCount,
		get,
		safeGet,
		set,
		add,
		remove,
		clear,
		save,
		saveMultiple,
		saveAll,
		isLoaded,
		isAllLoaded,
		getError,
		create,
		getKeys,
		getFilenames,
	};
});