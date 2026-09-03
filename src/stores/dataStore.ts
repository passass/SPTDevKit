// src/stores/dataStore.ts

import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useFileDataStore } from "./fileStore";
import { QuestSchema } from "@/types/fields/fieldsQuests";
import { idsFields, type RecordSchema, type SchemaData } from "@/types/fields/fields";
import { getValueByPath, type ClassType } from "@/utils/classUtils";
import { gameLocalization, type locales } from "@/types/localization";
import { allElementsInArray } from "@/utils/utils";

export interface DataStoreConfigFiles {
    filename: string;
    tags?: string[];
}
export interface DataStoreConfig {
    file: DataStoreConfigFiles | DataStoreConfigFiles[];
    schemaType?: ClassType<RecordSchema>;
}
export interface dataStoreExtraDataType {
    tags?: string[];
}
export type dataMapRecordType = {
	data: any;
	tags?: string[];
	dirty?: boolean;
};

export const useDataStore = defineStore("dataStore", () => {
    const fileStore = useFileDataStore();

    // Хранилище для всех данных: ключ -> Map<string, данные>
    const dataMap = ref<Map<string, Map<string, dataMapRecordType>>>(new Map());

    const configs = ref<Map<string, DataStoreConfig>>(new Map());

    const loadingStatus = ref<Map<string, boolean>>(new Map());
    const errorStatus = ref<Map<string, string | null>>(new Map());

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

    function addFileToStore(key: string, file: DataStoreConfigFiles) {
        const config = configs.value.get(key);
        if (!config) {
            throw new Error(`Store "${key}" not registered`);
        }

        const files = Array.isArray(config.file) ? config.file : [config.file];

        const exists = files.some((f) => f.filename === file.filename);
        if (exists) {
            console.warn(`File "${file.filename}" already exists in store "${key}"`);
            return;
        }

        files.push(file);

        config.file = files;
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
            const files = Array.isArray(config.file) ? config.file : [config.file];
            const store = dataMap.value.get(key)!;
            store.clear();

            const schemaType = config.schemaType;

            for (const file of files) {
                const filename = file.filename;
                const tags: string[] = getValueByPath(file, "tags", []);

                const fileData = await fileStore.read(filename);
                const fileContent = fileData.data ?? fileData;

                if (fileContent && typeof fileContent === "object") {
                    let entries: Record<string, any> = {};
                    if (tags.includes("oneObject")) {
                        const idField = idsFields.find((el) => el in fileContent);
                        if (idField) {
                            const idFieldValue: any = fileContent[idField];
                            if (idFieldValue) entries[idFieldValue] = fileContent;
                        }
                    } else {
                        entries = fileContent;
                    }

                    for (const [id, itemData] of Object.entries(entries)) {
                        // if (!store.has(id)) {
                        let value: any;
                        if (schemaType && itemData && typeof itemData === "object") {
                            value = new schemaType(itemData);
                            value.storeId = key;
                        } else {
                            value = itemData;
						}

						const storeResult = {
							data: value,
							tags: file.tags,
						}
						store.set(id, storeResult);
                        // } else {
                        //     console.warn(`Duplicate ID "${id}" found in file "${filename}", skipping...`);
                        // }
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

    function getAllElementsLocalizated(storeId: string): Record<string, string> {
        const res: Record<string, string> = {};
        for (const [itemId, value] of getMap(storeId).entries()) {
            res[itemId] = gameLocalization.getObjectLocalization({
                instance: value,
            });
        }
        return res;
    }

    function getByTagInStore(storeId: string, tag: string | string[]): Map<string, dataMapRecordType> {
        const store = getMap(storeId);
        const result: Map<string, dataMapRecordType> = new Map();

        for (const [id, value] of store) {
            if (
                value &&
                (typeof tag === "string"
                    ? value.tags?.includes(tag)
                    : value.tags && allElementsInArray(tag, value.tags))
            ) {
                result.set(id, value);
            }
        }

        return result;
    }

    // Загрузка нескольких хранилищ
    async function loadMultiple(keys: string[]) {
        const promises = keys.map((key) => load(key));
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

        const filenames = Array.isArray(config.file) ? config.file : [config.file];
        for (const filename of filenames) {
            await fileStore.reload(getValueByPath(filename, "filename", filename));
        }
        await load(key);
    }

    // Перезагрузка нескольких
    async function reloadMultiple(keys: string[]) {
        const promises = keys.map((key) => reload(key));
        await Promise.all(promises);
    }

    // Получить весь Map
    function getMap<T = any>(key: string): Map<string, dataMapRecordType> {
        const store = dataMap.value.get(key);
        if (!store) {
            throw new Error(`Store "${key}" not found`);
        }
        return store as Map<string, dataMapRecordType>;
    }

	function addTag(storeId: string, key: string, tag: string) {
		let data = getMap(storeId).get(key)

		if (!data) {
			throw new Error("no data")
		}

		data.tags ??= []
		if (!data.tags.includes(tag))
			data.tags.push(tag);
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
    function get(key: string, id: string): dataMapRecordType["data"] | undefined {
        return getMap(key).get(id)?.data;
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
        const value = store?.get(id);
        return (value?.data) as T | undefined ?? def;
    }


	function set(key: string, id: string, data: dataMapRecordType["data"]) {
		const map = getMap(key)
		const dataRecord = map.get(id);
		if (dataRecord) {
			dataRecord.data = data;
		} else {
			map.set(id, { data });
		}
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
        const filenames = Array.isArray(config.file) ? config.file : [config.file];

        // Если несколько файлов, сохраняем в первый
        const filename = getValueByPath(filenames[0], "filename", filenames[0]);

        const result: Record<string, any> = {};
        for (const [id, data] of store) {
            if (data && typeof data === "object" && "toJSON" in data && typeof data.toJSON === "function") {
                result[id] = data.toJSON();
            } else {
                result[id] = data;
            }
        }

        await fileStore.write(filename, result);
    }

    // Сохранить несколько
    async function saveMultiple(keys: string[]) {
        const promises = keys.map((key) => save(key));
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
        return keys.every((key) => isLoaded(key));
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

        return Array.isArray(config.file) ? config.file.map((el) => el.filename) : [config.file.filename];
    }

    function getSchemaType(key: string): DataStoreConfig["schemaType"] | undefined {
        return configs.value.get(key)?.schemaType;
	}

	function isDirty(storeId: string, id: string): boolean {
		const store = getMap(storeId);
		return !!(store.has(id) && store.get(id)!.dirty);
	}

	function markDirty(storeId: string, id: string) {
		const store = getMap(storeId);
		if (store.has(id)) {
			store.get(id)!.dirty = true;
		}
	}

	function getAllDirties(storeId: string): dataMapRecordType[] {
		const store = getMap(storeId);
		return Array.from(store.values())
			.filter((data) => data.dirty);
	}

	return {
        dataMap,
        getSchemaType,
        addFileToStore,
        getByTagInStore,
        getAllElementsLocalizated,
        configs,
        loadingStatus,
        errorStatus,
        register,
        registerMultiple,
        load,
        loadMultiple,
        loadAll,
        reload,
		markDirty,
		isDirty,
        getAllDirties,
        reloadMultiple,
        getMap,
        getIds,
        getCount,
        get,
        safeGet,
        set,
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

        addTag,
    };
});
