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
import type { IOptionItem } from "@/consts/AdvancedSelectInputConsts";
import type { FieldContext } from "../fields/fieldsConsts";
import { buffsDataStore } from "@/project/Buffs";

class StimBuffs extends AdvSelectField {
    key = "StimulatorBuffs";
    type: FieldType = "advancedSelect";
	storeId = "buffs";
	order = 5;

    getOptionsItems(fieldContext: FieldContext): Map<string | number, IOptionItem | RecordSchema | string> {
        const res = new Map();

        for (const buff of buffsDataStore.getArray()) {
			if (!(buff.data instanceof RecordSchema)) continue;
            console.log(buff.data, buff.data.getRepresentation, buff.data.getRepresentation && buff.data.getRepresentation())
            res.set(
                buff.data.get("id"),
                buff.data
            );
        }

        return res;
    }
}

export class LocaleEntrySchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "name",
            type: "text",
            order: 1,
        }),
        Field.create({
            key: "shortName",
            type: "text",
            order: 2,
        }),
        Field.create({
            key: "description",
            type: "textarea",
            order: 3,
        }),
    ];
}

export class StaticLootContainerSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "containerName",
            type: "text",
            order: 1,
        }),
        Field.create({
            key: "probability",
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
        }),

        // ===== ОСНОВНЫЕ ПОЛЯ =====
        AdvSelectField.create({
            key: "itemTplToClone",
            extraKeys: ["_proto"],
            type: "advancedSelect",
            storeId: "items",
            order: 1,

            alwaysFillWithDefault: true,
            defaultValue: "",
        }),

        AdvSelectField.create({
            key: "parentId",
            extraKeys: ["_parent"],
            type: "advancedSelect",
            storeId: "items",
            order: 2,
        }),

        Field.create({
            key: "handbookParentId",
            type: "select",
			order: 3,
            fillWithDefaultOnCreate: true,
            options: [
                "5b47574386f77428ca22b345",
                "5b5f757486f774093e6cb507",
                "5b47574386f77428ca22b2f3",
                "5b47574386f77428ca22b2f6",
                "5b5f6f3c86f774094242ef87",
                "5b5f704686f77447ec5d76d7",
                "5b5f78e986f77447ed5636b1",
                "5b5f79a486f77409407a7f94",
                "5b5f6f8786f77447ed563642",
                "5b47574386f77428ca22b2ee",
                "5b47574386f77428ca22b339",
                "5b5f796a86f774093f2ed3c0",
                "5b5f798886f77447ed5636b5",
                "5b5f6fd286f774093f2ecf0d",
                "5b47574386f77428ca22b33b",
                "5b47574386f77428ca22b2ef",
                "5b5f78fc86f77409407a7f90",
                "5b5f746686f77447ec5d7708",
                "5b5f701386f774093f2ecf0f",
                "5b5f744786f774094242f197",
                "5b5f740a86f77447ec5d7706",
                "5b47574386f77428ca22b341",
                "5b5f7a2386f774093f2ed3c4",
                "5b5f75c686f774094242f19f",
                "5b5f73c486f77447ec5d7704",
                "5b5f79eb86f77447ed5636b7",
                "5b5f73ab86f774094242f195",
                "5b47574386f77428ca22b330",
                "5b47574386f77428ca22b33c",
                "5b47574386f77428ca22b331",
                "5b47574386f77428ca22b33a",
                "5b5f72f786f77447ec5d7702",
                "5b5f794b86f77409407a7f92",
                "5b5f742686f774093e6cb4ff",
                "5b5f737886f774093e6cb4fb",
                "5b5f724c86f774093f2ecf15",
                "5b5f754a86f774094242f19b",
                "5b5f6f6c86f774093f2ecf0b",
                "5b47574386f77428ca22b32f",
                "5b5f748386f774093e6cb501",
                "5b5f74cc86f77447ec5d770a",
                "5b5f71de86f774093f2ecf13",
                "5b5f731a86f774093e6cb4f9",
                "5b5f751486f77447ec5d770c",
                "6564b96a189fe36f356d177c",
                "5b5f749986f774094242f199",
                "5b5f761f86f774094242f1a1",
                "5b5f755f86f77447ec5d770e",
                "5b47574386f77428ca22b2f1",
                "5b5f75e486f77447ec5d7712",
                "5c518ed586f774119a772aee",
                "5b5f760586f774093e6cb509",
                "5b5f6fa186f77409407a7eb7",
                "5b5f71c186f77409407a7ec0",
                "5b47574386f77428ca22b2f4",
                "5b5f764186f77447ec5d7714",
                "5b5f792486f77447ed5636b3",
                "5b619f1a86f77450a702a6f3",
                "5b5f791486f774093f2ed3be",
                "5b5f7a0886f77409407a7f96",
            ],
        }),

        Field.create({
            key: "overrideProperties",
            extraKeys: ["_props"],
            type: "object",
            order: 3,
            nestedSchema: createLazyRecordSchema("itemsOverrideProperties.json", "overrideProperties", {
                onSchemaLoad: (schemaNode) => {
                    (schemaNode.schema as typeof RecordSchema).replaceFieldWith(StimBuffs.create({}));
                },
            }),
        }),

        HiddenField.create({
            key: "locales",
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
            type: "number",
            order: 5,
            fillWithDefaultOnCreate: true,
            defaultValue: 100000,
        }),

        Field.create({
            key: "handbookPriceRoubles",
            type: "number",
            order: 6,
            fillWithDefaultOnCreate: true,
            defaultValue: 100000,
        }),

        // ===== НАСТРОЙКИ =====
        Field.create({
            key: "addCaliberToAllCloneLocations",
            type: "boolean",
            order: 7,
        }),

        Field.create({
            key: "addtoStaticAmmo",
            type: "boolean",
            order: 8,
        }),

        Field.create({
            key: "CanSellOnRagfair",
            type: "boolean",
            fillWithDefaultOnCreate: true,
            order: 9,
        }),

        Field.create({
            key: "CanRequireOnRagfair",
            type: "boolean",
            fillWithDefaultOnCreate: true,
            order: 10,
        }),

        Field.create({
            key: "addtoItemBlacklist",
            type: "boolean",
            order: 11,
        }),

        Field.create({
            key: "staticAmmoProbability",
            type: "number",
            order: 12,
        }),

        Field.create({
            key: "addtoBots",
            type: "boolean",
            order: 13,
        }),

        Field.create({
            key: "addtoStaticLootContainers",
            type: "boolean",
            order: 14,
        }),

        // ===== КОНТЕЙНЕРЫ ЛУТА =====
        Field.create({
            key: "staticLootContainers",
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
            order: 45,
            key: "Name",
        }),
        VirtualLocalizationField.create({
            order: 45,
            key: "Description",
        }),
        VirtualLocalizationField.create({
            order: 45,
            key: "ShortName",
        }),
    ];
}
