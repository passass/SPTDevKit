import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { readLocalJson, writeLocalJson } from "@/utils/fileReader";
import { Data } from "dataclass";
import { JsonConvert, JsonObject, JsonProperty } from "json2typescript";

const jsonConvert: JsonConvert = new JsonConvert();

// ===== Типы =====

export class FileConfig<T = any> extends Data {
	filename!: string;
	data: T | null = null;
	loading: boolean = false;
	error: string | null = null;
	initialized: boolean = false;
}

// Type guard
export function isLoaded<T>(
	config: FileConfig<T>,
): config is FileConfig<T> & { data: T } {
	return config.initialized && config.data !== null;
}

// ===== Store =====

export const useFileDataStore = defineStore("fileStore", () => {
	// Состояние
	const files = ref<Map<string, FileConfig>>(new Map());
	const globalLoading = ref(false);

	// Геттеры
	const isAllLoaded = computed(() => {
		if (files.value.size === 0) return false;
		return Array.from(files.value.values()).every((f) => f.initialized);
	});

	const anyLoading = computed(() =>
		Array.from(files.value.values()).some((f) => f.loading),
	);

	// Приватные helpers
	function getOrCreate<T>(filename: string): FileConfig<T> {
		if (files.value.has(filename)) {
			return files.value.get(filename) as FileConfig<T>
		}
		else {
			const newFileConfig: FileConfig = FileConfig.create({
				filename: filename,
			});
			files.value.set(filename, newFileConfig);
			return newFileConfig;
		}
	}

	function updateConfig<T>(
		filename: string,
		patch: Partial<FileConfig<T>>,
	): void {
		const existing = files.value.get(filename);
		if (existing) {
			files.value.set(filename, { ...existing, ...patch } as FileConfig);
		}
	}

	async function read<T = any>(filename: string): Promise<FileConfig<T>> {
		const config = getOrCreate<T>(filename);

		// Уже в кэше
		if (isLoaded(config)) {
			return config;
		}

		// Уже грузится — ждём
		if (config.loading) {
			await waitFor(filename);
			const refreshed = files.value.get(filename);
			if (!refreshed || !isLoaded(refreshed)) {
				throw new Error(`Ошибка загрузки ${filename}`);
			}
			return refreshed as FileConfig<T>;
		}

		// Начинаем загрузку
		updateConfig(filename, { loading: true, error: null });

		try {
			const data = (await readLocalJson(filename)) as T;
			updateConfig(filename, { data, initialized: true, loading: false });
			
			// Возвращаем обновленный конфиг
			const updatedConfig = files.value.get(filename);
			if (!updatedConfig) {
				throw new Error(`Не удалось получить конфиг после загрузки ${filename}`);
			}
			return updatedConfig as FileConfig<T>;
		} catch (err: any) {
			updateConfig(filename, { error: err.message, loading: false });
			throw err;
		}
	}

	/**
	 * Сохранить файл. Обновляет кэш при успехе.
	 */
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

	/**
	 * Прочитать данные из кэша без загрузки.
	 */

	function getData(filename: string): unknown | null;
	function getData<T extends object>(filename: string, dataType: new () => T): T | null;

	// Одна реализация
	function getData<T extends object>(filename: string, dataType?: new () => T): unknown | T | null {
		const config = getOrCreate(filename);

		if (!isLoaded(config) || !config.data) {
			return null;
		}

		if (dataType) {
			return jsonConvert.deserialize(
				config.data as object[],
				dataType
			) as T;
		}

		return config.data;
	}
	/**
	 * Требовательное чтение — кинет ошибку если не загружено.
	 */
	function getDataOrThrow(filename: string): unknown;
	function getDataOrThrow<T extends object>(filename: string, dataType: new () => T): T;

	function getDataOrThrow<T extends object>(filename: string, dataType?: new () => T): unknown | T {
		
		let data;
		if (dataType)
			data = getData<T>(filename, dataType);
		else
			data = getData(filename);
		if (data === null) {
			throw new Error(
				`Файл "${filename}" не загружен. Вызовите read() сначала.`,
			);
		}
		return data as T;
	}

	/**
	 * Type-safe проверка с результатом.
	 */
	function getDataIfLoaded<T = any>(
		filename: string,
	): { loaded: true; data: T } | { loaded: false; data: null } {
		const config = getOrCreate<T>(filename);
		if (isLoaded(config)) {
			return { loaded: true, data: config.data };
		}
		return { loaded: false, data: null };
	}

	async function reload<T = any>(filename: string): Promise<FileConfig<T>> {
		files.value.delete(filename);
		return read<T>(filename);
	}

	/**
	 * Очистить кэш файла.
	 */
	function clear(filename: string): void {
		files.value.delete(filename);
	}

	/**
	 * Очистить весь кэш.
	 */
	function clearAll(): void {
		files.value.clear();
	}

	// ===== Внутренние =====

	function waitFor(filename: string): Promise<void> {
		return new Promise((resolve) => {
			const check = () => {
				const config = files.value.get(filename);
				if (!config?.loading) {
					resolve();
				} else {
					setTimeout(check, 50);
				}
			};
			check();
		});
	}

	return {
		// State
		files,
		globalLoading,
		// Getters
		isAllLoaded,
		anyLoading,
		getOrCreate,
		// Actions
		read,
		write,
		getData,
		getDataOrThrow,
		getDataIfLoaded,
		reload,
		clear,
		clearAll,
	};
});
