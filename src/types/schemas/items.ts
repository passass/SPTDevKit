// src/types/schemas/ammoCloneSchema.ts

import {
    Field,
    RecordSchema,
    type FieldType,
    LocalizationField,
    VirtualLocalizationField,
    type SchemaData,
    AdvSelectField,
    getIdFieldValue,
    castToRecordSchema,
	type SchemaValue,
} from "@/types/fields/fields";
import { HiddenField, IdField } from "@/types/fields/fieldsClasses";
import { createLazyRecordSchema } from "@/utils/lazySchemaLoader";
import { availableLocales, gameLocalization, type locales } from "../localization";
import { capitalize } from "vue";
import { LootSpawnsField } from "./lootLocation";

export class LocaleEntrySchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "name",
            label: "Название",
            type: "text",
            order: 1,
        }),
        Field.create({
            key: "shortName",
            label: "Краткое название",
            type: "text",
            order: 2,
        }),
        Field.create({
            key: "description",
            label: "Описание",
            type: "textarea",
            order: 3,
        }),
    ];
}

export class StaticLootContainerSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "containerName",
            label: "Имя контейнера",
            type: "text",
            order: 1,
        }),
        Field.create({
            key: "probability",
            label: "Вероятность",
            type: "number",
            order: 2,
            defaultValue: 0,
        }),
    ];
}

export class itemsSchema extends RecordSchema {
    static fields: Field[] = [
        IdField.create({
            key: "id",
            extraKeys: ["_id"],
            label: "ID предмета",
        }),

        // ===== ОСНОВНЫЕ ПОЛЯ =====
        AdvSelectField.create({
            key: "itemTplToClone",
            extraKeys: ["_proto"],
            label: "Шаблон для клонирования",
            type: "advancedSelect",
            storeId: "items",
			order: 1,

			alwaysFillWithDefault: true,
			defaultValue: "",
		}),

        AdvSelectField.create({
            key: "parentId",
            extraKeys: ["_parent"],
            label: "Родительский ID",
            type: "advancedSelect",
            storeId: "items",
            order: 2,
        }),

        Field.create({
            key: "handbookParentId",
            label: "Родительский ID в справочнике",
            type: "select",
            order: 3,
            options: [
                "5b47574386f77428ca22b33c", // Патроны
                "5b47574386f77428ca22b33d", // Оружие
                "5b47574386f77428ca22b33e", // Моды
                "5b47574386f77428ca22b33f", // Медицина
                "5b47574386f77428ca22b340", // Еда
                "5b47574386f77428ca22b341", // Броня
                "5b47574386f77428ca22b342", // Разгрузки
                "5b47574386f77428ca22b343", // Ключи
                "5b47574386f77428ca22b344", // Боеприпасы
            ],
        }),

        Field.create({
            key: "overrideProperties",
            extraKeys: ["_props"],
            label: "Дополнительные свойства",
            type: "object",
            order: 3,
            nestedSchema: createLazyRecordSchema("itemsOverrideProperties.json", "overrideProperties"),
        }),

        HiddenField.create({
            key: "locales",
            label: "Локализация",
			type: "object",
			alwaysFillWithDefault: true,
			defaultValue: {},
            onIfInData: (data: SchemaData) => {
                if (!data["locales"]) return;
                for (const [locale, localeIds] of Object.entries(data["locales"]) as Array<[string, SchemaValue]>) {
                    if (!localeIds || !Object.keys(localeIds).length || !availableLocales.includes(locale)) continue;
					for (const [localeId, text] of Object.entries(localeIds) as Array<[string, SchemaValue]>) {
						if (typeof text !== "string") continue;
                        gameLocalization.updateLocaleText(
                            { locale: locale as locales, localeId: `${getIdFieldValue(data)} ${capitalize(localeId)}` },
                            text
                        );
                    }
                }
            },
        }),

        // ===== ЦЕНЫ =====
        Field.create({
            key: "fleaPriceRoubles",
            label: "Цена на барахолке (рубли)",
            type: "number",
            order: 5,
            defaultValue: 0,
        }),

        Field.create({
            key: "handbookPriceRoubles",
            label: "Цена в справочнике (рубли)",
            type: "number",
            order: 6,
            defaultValue: 0,
        }),

        // ===== НАСТРОЙКИ =====
        Field.create({
            key: "addCaliberToAllCloneLocations",
            label: "Добавить калибр ко всем клонам",
            type: "boolean",
            order: 7,
        }),

        Field.create({
            key: "addtoStaticAmmo",
            label: "Добавить в статический боезапас",
            type: "boolean",
            order: 8,
        }),

        Field.create({
            key: "CanSellOnRagfair",
            label: "Можно продавать на барахолке",
            type: "boolean",
            order: 9,
        }),

        Field.create({
            key: "CanRequireOnRagfair",
            label: "Можно требовать на барахолке",
            type: "boolean",
            order: 10,
        }),

        Field.create({
            key: "addtoItemBlacklist",
            label: "Добавить в черный список",
            type: "boolean",
            order: 11,
        }),

        Field.create({
            key: "staticAmmoProbability",
            label: "Вероятность статического боезапаса",
            type: "number",
            order: 12,
        }),

        Field.create({
            key: "addtoBots",
            label: "Добавить ботам",
            type: "boolean",
            order: 13,
        }),

        Field.create({
            key: "addtoStaticLootContainers",
            label: "Добавить в статические контейнеры",
            type: "boolean",
            order: 14,
        }),

        // ===== КОНТЕЙНЕРЫ ЛУТА =====
        Field.create({
            key: "staticLootContainers",
            label: "Статические контейнеры лута",
            type: "array",
            order: 15,
            defaultValue: [],
            arrayItemSchema: StaticLootContainerSchema,
        }),

        LootSpawnsField.create({
            key: "LootSpawns",
            order: 20,
        }),

        VirtualLocalizationField.create({
            label: "name",
            order: 45,
            key: "Name",
        }),
        VirtualLocalizationField.create({
            label: "description",
            order: 45,
            key: "Description",
        }),
        VirtualLocalizationField.create({
            label: "shortname",
            order: 45,
            key: "ShortName",
        }),
    ];
}
