// src/utils/copyUtils.ts
import { RecordSchema, LocalizationField, VirtualLocalizationField, Field } from "@/types/fields/fields";
import { type FieldContext } from "@/types/fields/fieldsConsts";
import { useDataStore } from "@/stores/dataStore";
import { availableLocales, suffixes } from "@/types/localization";
import { deepClone } from "./utils";
import { generateUUID24chars } from "./uuidUtils";
import { IdField } from "@/types/fields/fieldsClasses";
import { Navigator } from "./navigation";
import { FunctionQueue } from "./functionQueue";

const noopNavigate: Navigator["navigate"] = (() => false) as Navigator["navigate"];

export function getAllLocalizationKeys(instance: RecordSchema): string[] {
    let keys: string[] = [];
    for (const field of instance.getFields()) {
        if (
            (field instanceof LocalizationField || field instanceof VirtualLocalizationField) &&
            field.getDefaultValue
        ) {
            keys.push(field.getDefaultValue(instance.getData()));
        } else if (field.nestedSchema) {
            const castedData = instance.getCastedData(field.key);
            if (castedData) keys = keys.concat(getAllLocalizationKeys(castedData));
        } else if (field.arrayItemSchema) {
            const castedArray = instance.getArrayCastedData(field.key);
            for (const item of castedArray) {
                keys = keys.concat(getAllLocalizationKeys(item));
            }
        }
    }
    return keys;
}

export function copyRecordSchema(
    original: RecordSchema,
	projectTag?: string
): RecordSchema {
	const sourceId = original.getId();
	const dataStore = useDataStore();
    const newItemId = generateUUID24chars();
    const idsMap = new Map<string, string>();

    const copiedData = deepClone(original.getData()) as Record<string, any>;
    const Constructor = original.constructor as typeof RecordSchema;
    const copiedSchema = new Constructor(copiedData, {
        choosedSchema: original.choosedSchema,
        schemaChooser: original.schemaChooser,
		name: original.name,
        isCreating: true,
	}) as RecordSchema;

	const fnQueue = new FunctionQueue();

    function callOnNestedSchemaCopy(
        field: Field,
        value: any,
		recordSchema: RecordSchema,
        original: RecordSchema
    ): void {
        if (!field.onNestedSchemaCopy) return;
        const ctx: FieldContext = {
            field,
            value,
            recordSchema,
			data: recordSchema.getData(),
            navigate: noopNavigate,
        };
        fnQueue.add("field.onNestedSchemaCopy", field.onNestedSchemaCopy, ctx, original)
	}

    // Fallback для «сырых» объектов/массивов без схемы (extraFields, неизвестные структуры)
    function changeAllIdsRaw(obj: any, isRoot = false): void {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj)) {
            obj.forEach((item) => changeAllIdsRaw(item, false));
            return;
        }
        for (const [key, value] of Object.entries(obj)) {
            if (key.toLocaleLowerCase() === "_id" || key.toLocaleLowerCase() === "id") {
                obj[key] = isRoot ? newItemId : generateUUID24chars();
                if (typeof value === "string") idsMap.set(value, obj[key]);
            } else if (typeof value === "string" && sourceId && value.includes(sourceId)) {
                obj[key] = value.replace(new RegExp(sourceId, "g"), newItemId);
            } else if (typeof value === "object" && value !== null) {
                changeAllIdsRaw(value, false);
            }
        }
    }

    function changeAllIds(schema: RecordSchema, isRoot = false): void {
		for (const field of schema.getFields()) {
			if (field.virtual) {
				callOnNestedSchemaCopy(field, undefined, schema, original);
				continue;
			}

            const key = field.key;
            if (!key || !schema.has(key)) continue;

            const value = schema.get(key);

            // ID-поля
            if (key === "_id" || key === "id" || field instanceof IdField) {
                const newId = isRoot ? newItemId : generateUUID24chars();
                if (typeof value === "string") idsMap.set(value, newId);
                schema.set(key, newId);
                continue;
            }

            // Вложенный объект со схемой
			if (field.nestedSchema && value && typeof value === "object" && !Array.isArray(value)) {
                const nested = schema.getCastedData(key);
                if (nested) {
                    callOnNestedSchemaCopy(field, nested, schema, original);
                    changeAllIds(nested, false);
                }
				continue;
            }

            // Массив с arrayItemSchema
            if (field.arrayItemSchema && Array.isArray(value)) {
                for (const item of schema.getArrayCastedData(key)) {
                    callOnNestedSchemaCopy(field, item, schema, original);
                    changeAllIds(item, false);
                }
                continue;
            }

            // Массив без схемы
            if (Array.isArray(value)) {
                changeAllIdsRaw(value, false);
                continue;
            }

            // Объект без схемы (extraFields и т.п.)
            if (value && typeof value === "object") {
                changeAllIdsRaw(value, false);
                continue;
            }

            // Строки, содержащие исходный ID
            if (typeof value === "string" && sourceId && value.includes(sourceId)) {
                schema.set(key, value.replace(new RegExp(sourceId, "g"), newItemId));
            }
        }
    }

    changeAllIds(copiedSchema, true);

    // ===== Второй проход: заменяем все значения, которые совпадают с ключами idsMap =====
    function replaceRawIdsFromMap(obj: any): void {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const v = obj[i];
                if (typeof v === "string" && idsMap.has(v)) {
                    obj[i] = idsMap.get(v);
                } else if (v && typeof v === "object") {
                    replaceRawIdsFromMap(v);
                }
            }
            return;
        }
        for (const [k, v] of Object.entries(obj)) {
            if (typeof v === "string" && idsMap.has(v)) {
                obj[k] = idsMap.get(v);
            } else if (v && typeof v === "object") {
                replaceRawIdsFromMap(v);
            }
        }
    }

    function replaceAllIdsFromMap(schema: RecordSchema): void {
        for (const field of schema.getFields()) {
            if (field.virtual) continue;
            const key = field.key;
            if (!key || !schema.has(key)) continue;

            const value = schema.get(key);

            if (field.nestedSchema && value && typeof value === "object" && !Array.isArray(value)) {
                const nested = schema.getCastedData(key);
                if (nested) replaceAllIdsFromMap(nested);
                continue;
            }

            if (field.arrayItemSchema && Array.isArray(value)) {
                for (const item of schema.getArrayCastedData(key)) {
                    replaceAllIdsFromMap(item);
                }
                continue;
            }

            if (typeof value === "string" && idsMap.has(value)) {
                schema.set(key, idsMap.get(value)!);
                continue;
            }

            if (Array.isArray(value)) {
                replaceRawIdsFromMap(value);
                continue;
            }
            if (value && typeof value === "object") {
                replaceRawIdsFromMap(value);
            }
        }
    }

    replaceAllIdsFromMap(copiedSchema);

    const oldLocaleKeys = getAllLocalizationKeys(original);
    const localeMapping = new Map<string, string>();

    for (const oldKey of oldLocaleKeys) {
        if (typeof oldKey === "string") {
            const newKey = idsMap.has(oldKey)
                ? idsMap.get(oldKey)!
                : sourceId
                ? oldKey.replace(new RegExp(sourceId, "g"), newItemId)
                : oldKey;
            localeMapping.set(oldKey, newKey);
        }
    }

	if (projectTag) {
		for (const [oldKey, newKey] of localeMapping.entries()) {
	        if (oldKey === newKey) continue;
	        for (const locale of availableLocales) {
	            const storeId = `${locale}${suffixes.localizationSuffix}`;
	            const text = dataStore.get(storeId, oldKey);
	            if (text !== undefined && text !== null) {
	                dataStore.set(storeId, newKey, text);
	                dataStore.addTag(storeId, newKey, projectTag);
	            }
	        }
		}
	}

	fnQueue.executeAll()

	return copiedSchema;
}
