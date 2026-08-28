// src/stores/fileStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { readLocalJson, writeLocalJson, readJson } from "@/utils/fileReader";
import { Data } from "dataclass";
import { JsonConvert } from "json2typescript";

const jsonConvert = new JsonConvert();

export class FileConfig<T = any> extends Data {
    filename!: string;
    data: T | null = null;
    loading: boolean = false;
    error: string | null = null;
    initialized: boolean = false;
}

export function isLoaded<T>(config: FileConfig<T>): config is FileConfig<T> & { data: T } {
    return config.initialized && config.data !== null;
}

export const useFileDataStore = defineStore("fileStore", () => {
    const files = ref<Map<string, FileConfig>>(new Map());
    const globalLoading = ref(false);

	const pathUtils = window?.electronAPI?.pathUtils ?? {}
    
    const pendingPromises = new Map<string, Promise<FileConfig<any>>>();

    const isAllLoaded = computed(() => files.value.size > 0 && Array.from(files.value.values()).every(f => f.initialized));
    const anyLoading = computed(() => Array.from(files.value.values()).some(f => f.loading));

    function getOrCreate<T>(filename: string): FileConfig<T> {
        if (!files.value.has(filename)) {
            files.value.set(filename, FileConfig.create({ filename }));
        }
        return files.value.get(filename) as FileConfig<T>;
    }

    function updateConfig<T>(filename: string, patch: Partial<FileConfig<T>>): void {
        const existing = files.value.get(filename);
        if (existing) {
            files.value.set(filename, { ...existing, ...patch } as FileConfig);
        }
    }

    async function read<T = any>(filename: string): Promise<FileConfig<T>> {
        const config = getOrCreate<T>(filename);

        if (isLoaded(config)) return config;
        
        if (config.loading && pendingPromises.has(filename)) {
            return pendingPromises.get(filename) as Promise<FileConfig<T>>;
        }

        updateConfig(filename, { loading: true, error: null });
        
        const loadPromise = (async () => {
            try {
                const data = await ((pathUtils?.isAbsolute?.(filename)) ? readJson : readLocalJson)(filename) as T;
                updateConfig(filename, { data, initialized: true, loading: false });
                return files.value.get(filename) as FileConfig<T>;
            } catch (err: any) {
                updateConfig(filename, { error: err.message, loading: false });
                throw err;
            } finally {
                pendingPromises.delete(filename);
            }
        })();

        pendingPromises.set(filename, loadPromise);
        return loadPromise;
    }

    async function write<T = any>(filename: string, data: T): Promise<void> {
        const config = getOrCreate<T>(filename);
        updateConfig(filename, { loading: true, error: null });
        try {
            await writeLocalJson(filename, data as any);
            updateConfig(filename, { data, initialized: true, loading: false });
        } catch (err: any) {
            updateConfig(filename, { error: err.message, loading: false });
            throw err;
        }
    }

    function getData(filename: string): unknown | null;
    function getData<T extends object>(filename: string, dataType: new () => T): T | null;
    function getData<T extends object>(filename: string, dataType?: new () => T): unknown | T | null {
        const config = getOrCreate(filename);
        if (!isLoaded(config) || !config.data) return null;
        if (dataType) return jsonConvert.deserialize(config.data as object[], dataType) as T;
        return config.data;
    }

    function getDataOrThrow(filename: string): unknown;
    function getDataOrThrow<T extends object>(filename: string, dataType: new () => T): T;
    function getDataOrThrow<T extends object>(filename: string, dataType?: new () => T): unknown | T {
        const data = dataType ? getData<T>(filename, dataType) : getData(filename);
        if (data === null) throw new Error(`Файл "${filename}" не загружен. Вызовите read() сначала.`);
        return data as T;
    }

    function getDataIfLoaded<T = any>(filename: string): { loaded: true; data: T } | { loaded: false; data: null } {
        const config = getOrCreate<T>(filename);
        if (isLoaded(config)) return { loaded: true, data: config.data };
        return { loaded: false, data: null };
    }

    async function reload<T = any>(filename: string): Promise<FileConfig<T>> {
        files.value.delete(filename);
        pendingPromises.delete(filename);
        return read<T>(filename);
    }

    function clear(filename: string): void {
        files.value.delete(filename);
        pendingPromises.delete(filename);
    }

    function clearAll(): void {
        files.value.clear();
        pendingPromises.clear();
    }

    return {
        files, globalLoading, isAllLoaded, anyLoading, getOrCreate,
        read, write, getData, getDataOrThrow, getDataIfLoaded, reload, clear, clearAll,
    };
});