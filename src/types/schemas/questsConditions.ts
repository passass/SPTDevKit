// src/types/fieldsQuestsConditions.ts

import { RecordSchema, Field, VirtualLocalizationField, AdvSelectField, type FieldType } from "@/types/fields/fields";
import {
    HiddenField,
    parentIdField,
    parentIdFieldWithParentsOnlyIds,
    UnneccesaryField,
} from "@/types/fields/fieldsClasses";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
import { type SchemaData } from "@/types/fields/fields";
import { createSchemaChoiceForCondition } from "@/types/fields/fieldsSchemaChoicer";
import { allElementsInArray } from "@/utils/utils";
import { IdField } from "../fields/fieldsClasses";
import { DogTagIds, DogTagIdsOptions } from "@/consts/GameConsts";
import { type SchemaNode } from "@/utils/schemaGenerator";
import { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";
import type { FieldContext } from "../fields/fieldsConsts";
import { gameLocalization, translateId, uitext } from "../localization";

const virtLocField = VirtualLocalizationField.create({
    label: "name",
    order: 2,
});

class DynamicLocale extends UnneccesaryField {
    key = "dynamicLocale";
    label = "Dynamic Locale";
    type: FieldType = "boolean";
    order = 200;
    alwaysFillWithDefault = true;
}

class LeaveItemAtLocationPlantTime extends Field {
    key = "plantTime";
    label = "plant Time";
    type: FieldType = "number";
    alwaysFillWithDefault = true;
    defaultValue = 5;
}

function commonFunctionForConditions(schemaNode: SchemaNode) {
    const choicer: typeof SchemaChoicer | typeof RecordSchema = schemaNode.schema;
    if (SchemaChoicer.isPrototypeOf(choicer) && "schemas" in choicer && Array.isArray(choicer.schemas)) {
        choicer;

        for (const schema of choicer.schemas) {
            schema.schema.replaceFieldWith(LeaveItemAtLocationPlantTime.create({}));
            schema.schema.replaceFieldWith(
                parentIdFieldWithParentsOnlyIds.create({
                    alwaysFillWithDefault: true,
                    unneccesary: true,
                    defaultValue: "",
                })
            );

            schema.schema.replaceFieldWith(DynamicLocale.create({}));
        }
    }
}

class DogTagField extends Field {
    virtual = true;
    key = "targetField";
    label = "Target";
    type: FieldType = "select";
    options = Array.from(Object.keys(DogTagIdsOptions));
    getDefaultValue(data: SchemaData) {
        for (const [key, value] of Object.entries(DogTagIdsOptions)) {
            if (Array.isArray(value) && Array.isArray(data.target) && allElementsInArray(value, data.target)) {
                return key;
            }
        }
        return null;
    }
}

class DogTagCondition extends RecordSchema {


    static fields: Field[] = [
        UnneccesaryField.create({
            key: "conditionType",
			type: "text",
			alwaysFillWithDefault: true,
            defaultValue: "HandoverItem",
        }),
        Field.create({
            key: "dogtagLevel",
            type: "number",
        }),

        DogTagField.create({
            onChange: (data: SchemaData, event: Event) => {
                const target = (event.target as HTMLSelectElement).value;
                const value = DogTagIdsOptions[target as keyof typeof DogTagIdsOptions];
                data.target = value;
            },
        }),
        UnneccesaryField.create({
            key: "dynamicLocale",
            type: "boolean",
            order: 200,
            alwaysFillWithDefault: true,
        }),
        UnneccesaryField.create({
            key: "globalQuestCounterId",
            type: "text",
            order: 200,
        }),
        IdField.create({
            key: "id",
            type: "text",
        }),
        UnneccesaryField.create({
            key: "index",
            type: "number",
            order: 200,
        }),
        UnneccesaryField.create({
            key: "isEncoded",
            type: "boolean",
        }),
        UnneccesaryField.create({
            key: "maxDurability",
            type: "number",
        }),
        UnneccesaryField.create({
            key: "minDurability",
            type: "number",
        }),
        Field.create({
            key: "onlyFoundInRaid",
            type: "boolean",
        }),
        UnneccesaryField.create({
            key: "parentId",
            type: "text",
        }),
        HiddenField.create({
            key: "target",
        }),
        Field.create({
            key: "value",
            type: "number",
        }),
    ];
}

export class ItemsListField extends Field {
    type: FieldType = "arrayList";
	getRepresentation(fieldContext: FieldContext, item: any): string | undefined {
        const schemaName = (fieldContext.field.arrayItemSchema as typeof SchemaChoicer).from(item)?.choosedSchema?.name;
        if (typeof schemaName !== "string") return undefined;
        const items = item["items"];
        if (items && typeof items === "object" && Array.isArray(items) && items.length > 0) {
            const itemsTemplates = [];
            for (const tplItem of items) {
                if (!tplItem._tpl || tplItem.parentId || typeof tplItem._tpl !== "string") continue;
                itemsTemplates.push(tplItem._tpl);
            }

            if (itemsTemplates.length > 0)
                return `${uitext("Items")}: ${itemsTemplates.map((tpl) => translateId(tpl)).join(", ")}`;
        }
        const conditionType = item.conditionType;
        if (typeof conditionType === "string" && conditionType) {
            if (conditionType === "Quest" && typeof item.target === "string" && item.target) {
                return `${uitext("Quest")}: ${translateId(item.target)}`;
            }
            if ((conditionType === "FindItem" || conditionType === "HandoverItem") && Array.isArray(item.target) && item.target.length > 0) {
                const itemsTemplates = [];
                for (const tplItem of item.target) {
                    itemsTemplates.push(tplItem);
                }

                if (itemsTemplates.length > 0)
                    return `${uitext("HandoverItem")}: ${itemsTemplates.map((tpl) => translateId(tpl)).join(", ")}`;
            }
        }

        return uitext(schemaName);
    }
}

export class QuestConditions extends RecordSchema {
    static fields: Field[] = [
        ItemsListField.create({
            key: "AvailableForStart",
            arrayItemSchema: createLazySchemaChoicer(
                "questsSchemas.json",
                "*.conditions.AvailableForStart",
                "AvailableForStartCondition",
                {
                    onSchemaLoad: commonFunctionForConditions,
                }
            ),
        }),
        ItemsListField.create({
            key: "AvailableForFinish",
            arrayItemSchema: createLazySchemaChoicer(
                "questsSchemas.json",
                "*.conditions.AvailableForFinish",
                "AvailableForFinishCondition",
                {
                    fields: [virtLocField],
                    schemas: [
                        createSchemaChoiceForCondition({
                            name: "DogTagSchema",
                            schema: DogTagCondition,
                            conditionType: "HandoverItem",
                            condition: (data: SchemaData) => {
                                return (
                                    data.conditionType === "HandoverItem" &&
                                    Array.isArray(data.target) &&
                                    typeof data.target[0] === "string" &&
                                    DogTagIds.includes(data.target[0])
                                );
                            },
                        }),
                    ],
                    onSchemaLoad: commonFunctionForConditions,
                }
            ),
        }),
        ItemsListField.create({
            key: "Fail",
            arrayItemSchema: createLazySchemaChoicer("questsSchemas.json", "*.conditions.Fail", "FailCondition", {
                onSchemaLoad: commonFunctionForConditions,
            }),
        }),
    ];
}
