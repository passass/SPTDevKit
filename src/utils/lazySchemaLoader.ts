// src/utils/lazySchemaLoader.ts

import type { ClassType } from "@/utils/classUtils";
import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { RecordSchema, type Field } from "@/types/fields/fields";
import { useFileDataStore } from "@/stores/fileStore";
import { generateAllSchemas, type SchemaNode } from "@/utils/schemaGenerator";

let cachedTree: SchemaNode | null = null;
let isLoading = false;
let loadPromise: Promise<SchemaNode> | null = null;

const lazyClassesRegistry: Array<{ load: () => Promise<void> }> = [];

export async function loadAllLazySchemas(): Promise<void> {
    await Promise.all(lazyClassesRegistry.map((loader) => loader.load()));
}

async function loadTree(): Promise<SchemaNode> {
    if (cachedTree) {
        return cachedTree;
    }

    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;
    loadPromise = (async () => {
        try {
            const fileStore = useFileDataStore();
            const outputJson = await fileStore.read("questsSchemas.json");
            const tree = generateAllSchemas(outputJson.data);
            cachedTree = tree;
            return tree;
        } finally {
            isLoading = false;
            loadPromise = null;
        }
    })();

    return loadPromise;
}

function findSchemaByPath(tree: SchemaNode, path: string): SchemaNode | null {
    if (tree.path === path) {
        return tree;
    }
    for (const child of tree.children) {
        const found = findSchemaByPath(child, path);
        if (found) {
            return found;
        }
    }
    return null;
}

export function createLazySchemaChoicer(
    path: string,
    className: string
): ClassType<SchemaChoicer> {
    let cachedSchema: any = null;
    let isLoaded = false;

    class LazySchemaChoicer extends SchemaChoicer {
        static get schemas(): SchemaChoice[] {
            if (!isLoaded) {
                throw new Error(
                    `Schema "${className}" not loaded yet. Call ${className}.load() first.`
                );
            }
            
            if (!cachedSchema) {
                return [];
            }
            
            // Если cachedSchema - это класс SchemaChoicer
            if (cachedSchema.prototype instanceof SchemaChoicer) {
                return cachedSchema.schemas || [];
            }
            
            // Если cachedSchema - это массив схем
            if (Array.isArray(cachedSchema)) {
                return cachedSchema;
            }
            
            return [];
        }

        static async load(): Promise<void> {
            if (isLoaded) {
                return;
            }

            try {
                const tree = await loadTree();
                const node = findSchemaByPath(tree, path);
                if (node && node.schema) {
                    cachedSchema = node.schema;
                    
                    // Если это SchemaChoicer, копируем его schemas
                    if (cachedSchema.prototype instanceof SchemaChoicer) {
                        // Создаем статическое свойство schemas
                        Object.defineProperty(LazySchemaChoicer, 'schemas', {
                            get: () => cachedSchema.schemas || [],
                            enumerable: true,
                            configurable: true
                        });
                    }
                    
                    isLoaded = true;
                } else {
                    throw new Error(`Schema not found for path: ${path}`);
                }
            } catch (error) {
                console.error(`Failed to load schema "${className}":`, error);
                throw error;
            }
        }

        static isLoaded(): boolean {
            return isLoaded;
        }
    }

    // Сохраняем имя класса
    Object.defineProperty(LazySchemaChoicer, 'name', { value: className });
    lazyClassesRegistry.push(LazySchemaChoicer);
    return LazySchemaChoicer;
}

export function createLazyRecordSchema(
    path: string,
    className: string
): ClassType<RecordSchema> {
    let cachedSchema: any = null;
    let isLoaded = false;

    class LazyRecordSchema extends RecordSchema {
        static get fields(): Field[] {
            if (!isLoaded) {
                throw new Error(
                    `Schema "${className}" not loaded yet. Call ${className}.load() first.`
                );
            }
            
            if (!cachedSchema) {
                return [];
            }
            
            return cachedSchema.fields || [];
        }

        static async load(): Promise<void> {
            if (isLoaded) {
                return;
            }

            try {
                const tree = await loadTree();
                const node = findSchemaByPath(tree, path);
                
                if (node && node.schema) {
                    cachedSchema = node.schema;
                    
                    // Копируем поля
                    if (cachedSchema.fields) {
                        Object.defineProperty(LazyRecordSchema, 'fields', {
                            get: () => cachedSchema.fields || [],
                            enumerable: true,
                            configurable: true
                        });
                    }
                    
                    isLoaded = true;
                } else {
                    throw new Error(`Schema not found for path: ${path}`);
                }
            } catch (error) {
                console.error(`Failed to load schema "${className}":`, error);
                throw error;
            }
        }

        static isLoaded(): boolean {
            return isLoaded;
        }
    }

    Object.defineProperty(LazyRecordSchema, 'name', { value: className });
    lazyClassesRegistry.push(LazyRecordSchema);
    return LazyRecordSchema;
}
