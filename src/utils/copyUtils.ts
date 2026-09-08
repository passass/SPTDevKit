// src/utils/copyUtils.ts
import { RecordSchema, LocalizationField, VirtualLocalizationField } from "@/types/fields/fields";
import { useDataStore } from "@/stores/dataStore";
import { availableLocales, suffixes } from "@/types/localization";
import { deepClone } from "./utils";
import { generateUUID24chars } from "./uuidUtils";

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

export function copyRecordSchema<T extends RecordSchema>(
    original: T,
    dataStore: ReturnType<typeof useDataStore>,
    projectTag: string
): T {
    const copiedData = deepClone(original.getData()) as Record<string, any>;
    const sourceId = original.getId();
    const newItemId = generateUUID24chars();
    const idsMap = new Map<string, string>();

    function changeAllIds(obj: any, isRoot = false): void {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj)) {
            obj.forEach((item) => changeAllIds(item, false));
            return;
        }
        for (const [key, value] of Object.entries(obj)) {
            if (key === "_id" || key === "id") {
                obj[key] = isRoot ? newItemId : generateUUID24chars();
                idsMap.set(value as string, obj[key]);
            } else if (typeof value === "string" && sourceId && value.includes(sourceId)) {
                obj[key] = value.replace(new RegExp(sourceId, "g"), newItemId);
            } else if (typeof value === "object" && value !== null) {
                changeAllIds(value, false);
            }
        }
    }

    changeAllIds(copiedData, true);

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

    const Constructor = original.constructor as typeof RecordSchema;
    return new Constructor(copiedData, {
        choosedSchema: original.choosedSchema,
        schemaChooser: original.schemaChooser,
    }) as T;
}
