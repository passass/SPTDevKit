// src/utils/lazySchemaLoader.ts

import type { ClassType } from "@/utils/classUtils";
import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { RecordSchema, type Field } from "@/types/fields/fields";
import { useFileDataStore } from "@/stores/fileStore";
import { generateAllSchemas, type SchemaNode } from "@/utils/schemaGenerator";

// filepath -> schemanode
const cachedTrees: Map<string, SchemaNode> = new Map();
// filepath -> path -> field[]
const additionalFields: Map<string, Map<string, Field[]>> = new Map();
let isLoading = false;
let loadPromise: Promise<SchemaNode> | null = null;

const lazyClassesRegistry: Array<{ load: () => Promise<void> }> = [];

export async function loadAllLazySchemas(): Promise<void> {
    await Promise.all(lazyClassesRegistry.map((loader) => loader.load()));
}

async function loadTree(filePath: string): Promise<SchemaNode> {
    if (cachedTrees.get(filePath)) {
        return cachedTrees.get(filePath) as SchemaNode;
    }

    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;
    loadPromise = (async () => {
        try {
            const fileStore = useFileDataStore();
            const outputJson = await fileStore.read(filePath);
            const tree = generateAllSchemas(outputJson.data);
            cachedTrees.set(filePath, tree);

            const newAdditionalFields = additionalFields?.get(filePath);
            if (newAdditionalFields) {
                for (const [path, fields] of newAdditionalFields.entries()) {
                    const schemaNode = findSchemaByPath(tree, path);
                    const schema = schemaNode?.schema;

                    if (!schema) continue;

                    for (const field of fields) {
                        const isSchemaChoicer = SchemaChoicer.isPrototypeOf(schema);
                        const isRecordSchema = RecordSchema.isPrototypeOf(schema);
                        if (isRecordSchema && "fields" in schema) {
                            schema.fields = [...(schema.fields as Field[]), additionalFields];
                        } else if (isSchemaChoicer && "schemas" in schema && Array.isArray(schema.schemas)) {
                            const schemas: SchemaChoice[] = schema.schemas;
                            for (const schemaChoice of schemas) {
                                if ("fields" in schemaChoice?.schema && Array.isArray(schemaChoice?.schema?.fields)) {
                                    schemaChoice?.schema?.fields?.push(field);
                                }
                            }
                        }
                    }
                }
            }

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
    filePath: string,
    path: string,
    className: string,
    newAdditionalFields: Field[] = []
): ClassType<SchemaChoicer> {
    additionalFields.set(filePath, additionalFields.get(filePath) ?? new Map());
    additionalFields.get(filePath)?.set(path, newAdditionalFields);
    let cachedSchema: any = null;
    let isLoaded = false;

    class LazySchemaChoicer extends SchemaChoicer {
        static newFields = [];
        static get schemas(): SchemaChoice[] {
            if (!isLoaded) {
                throw new Error(`Schema "${className}" not loaded yet. Call ${className}.load() first.`);
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
                const tree = await loadTree(filePath);
                const node = findSchemaByPath(tree, path);
                if (node && node.schema) {
                    cachedSchema = node.schema;

                    // Если это SchemaChoicer, копируем его schemas
                    if (cachedSchema.prototype instanceof SchemaChoicer) {
                        Object.defineProperty(LazySchemaChoicer, "schemas", {
                            get: () => cachedSchema.schemas || [],
                            enumerable: true,
                            configurable: true,
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

        static withAdditionalField(field: Field) {}
    }

    // Сохраняем имя класса
    Object.defineProperty(LazySchemaChoicer, "name", { value: className });
    lazyClassesRegistry.push(LazySchemaChoicer);
    return LazySchemaChoicer;
}

export function createLazyRecordSchema(filePath: string, path: string, className: string): ClassType<RecordSchema> {
    let cachedSchema: any = null;
    let isLoaded = false;

    class LazyRecordSchema extends RecordSchema {
        static get fields(): Field[] {
            if (!isLoaded) {
                throw new Error(`Schema "${className}" not loaded yet. Call ${className}.load() first.`);
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
                const tree = await loadTree(filePath);
                const node = findSchemaByPath(tree, path);

                if (node && node.schema) {
                    cachedSchema = node.schema;

                    // Копируем поля
                    if (cachedSchema.fields) {
                        Object.defineProperty(LazyRecordSchema, "fields", {
                            get: () => cachedSchema.fields || [],
                            enumerable: true,
                            configurable: true,
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

    Object.defineProperty(LazyRecordSchema, "name", { value: className });
    lazyClassesRegistry.push(LazyRecordSchema);
    return LazyRecordSchema;
}
