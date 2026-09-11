// src/stores/dataStore.ts

import { defineStore } from "pinia";
import { ref } from "vue";
import { useFileDataStore } from "./fileStore";
import { castToRecordSchema, idsFields, RecordSchema, type SchemaData, type SchemaDataObject } from "@/types/fields/fields";
import { getValueByPath } from "@/utils/utils";
import { gameLocalization, type locales } from "@/types/localization";
import { allElementsInArray } from "@/utils/utils";
import type { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";

export interface DataStoreConfigFiles {
    filename: string;
    tags?: string[];
}
export interface DataStoreConfig {
    file: DataStoreConfigFiles | DataStoreConfigFiles[];
	schemaType?: typeof RecordSchema | typeof SchemaChoicer;
	manualClear?: boolean;
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

            if (!config.manualClear)
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
							value = castToRecordSchema(itemData, schemaType);
							if (!value.getId()) {
                                value.set("id", id)
                            }
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

	function addSchema(key: string, id: string, val: SchemaData | RecordSchema) {
		const map = getMap(key);
		const schemaType = getSchemaType(key);
		let res;
		if (schemaType && RecordSchema.isPrototypeOf(schemaType)) {
			res = (schemaType as typeof RecordSchema).from(val);
		} else {
			res = val;
		}

		map.set(id, { data: res });
	}

	// Удалить элемент
    function remove(key: string, id: string): boolean {
        return getMap(key).delete(id);
    }

    // Очистить все данные по ключу
    function clear(key: string) {
        getMap(key).clear();
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
            value = castToRecordSchema(data, config.schemaType);
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
        addSchema,
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
        isLoaded,
        isAllLoaded,
        getError,
        create,
        getKeys,
        getFilenames,

        addTag,
    };
});

export class dataStore {
	storeId: string;
	dataSt?: ReturnType<typeof useDataStore>;
	constructor(storeId: string) {
		this.storeId = storeId;
	}

	register(config: DataStoreConfig) {
		if (!this.dataSt) this.dataSt = useDataStore();
		this.dataSt.register(this.storeId, config);
	}

	addSchema(id: string, value: RecordSchema | SchemaDataObject) {
		if (!this.dataSt) this.dataSt = useDataStore();
		this.dataSt.addSchema(this.storeId, id, value);
	}

	addTag(id: string, tag: string) {
		if (!this.dataSt) this.dataSt = useDataStore();
		this.dataSt.addTag(this.storeId, id, tag);
	}

	getMap() {
		if (!this.dataSt) this.dataSt = useDataStore();
		return this.dataSt.getMap(this.storeId);
	}

	getKeys() {
		if (!this.dataSt) this.dataSt = useDataStore();
		return this.dataSt.getKeys();
	}

	isInited() {
		if (!this.dataSt) this.dataSt = useDataStore();
		return this.dataSt.getKeys().includes(this.storeId);
	}

	remove(id: string) {
		if (!this.dataSt) this.dataSt = useDataStore();
		this.dataSt.remove(this.storeId, id);
	}

	async load() {
		if (!this.dataSt) this.dataSt = useDataStore();
		await this.dataSt.load(this.storeId);
	}

	addFileToStore(file: { filename: string; tags: string[] }) {
		if (!this.dataSt) this.dataSt = useDataStore();
		this.dataSt.addFileToStore(this.storeId, file);
	}

	getByTagInStore(tag: string | string[]) {
		if (!this.dataSt) this.dataSt = useDataStore();
		return this.dataSt.getByTagInStore(this.storeId, tag);
	}

	get config() {
		if (!this.dataSt) this.dataSt = useDataStore();
		return this.dataSt.configs.get(this.storeId);
	}
}
