// src/types/fieldsQuestsConditions.ts

import { RecordSchema, Field, VirtualLocalizationField, AdvSelectField, type FieldType } from "@/types/fields/fields";
import { HiddenField, parentIdField, parentIdFieldWithParentsOnlyIds, UnneccesaryField } from "@/types/fields/fieldsClasses";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
import { type SchemaData } from "@/types/fields/fields";
import { createSchemaChoiceForCondition } from "@/types/fields/fieldsSchemaChoicer";
import { allElementsInArray } from "@/utils/utils";
import { IdField } from "../fields/fieldsClasses";
import { DogTagIds, DogTagIdsOptions } from "@/consts/GameConsts";
import { type SchemaNode } from "@/utils/schemaGenerator";
import { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";

const virtLocField = VirtualLocalizationField.create({
    label: "name",
    order: 2,
});

class DynamicLocale extends UnneccesaryField {
	key = "dynamicLocale"
    label = "Dynamic Locale"
    type: FieldType = "boolean"
    order = 200
    alwaysFillWithDefault = true
}

class LeaveItemAtLocationPlantTime extends Field {
	key = "plantTime"
    label = "plant Time"
    type: FieldType = "number"
	alwaysFillWithDefault = true
	defaultValue = 5
}

function commonFunctionForConditions(schemaNode: SchemaNode) {
	const choicer: typeof SchemaChoicer | typeof RecordSchema = schemaNode.schema;
    if (
        SchemaChoicer.isPrototypeOf(choicer) &&
        "schemas" in choicer &&
        Array.isArray(choicer.schemas)
	) {
		for (const schema of choicer.schemas) {
			schema.schema.replaceFieldWith(LeaveItemAtLocationPlantTime.create({}))
			schema.schema.replaceFieldWith(parentIdFieldWithParentsOnlyIds.create({
				alwaysFillWithDefault: true,
				unneccesary: true,
				defaultValue: "",
			}))

			schema.schema.replaceFieldWith(DynamicLocale.create({}))
		}
    }
}

class DogTagCondition extends RecordSchema {
    static fields: Field[] = [
        UnneccesaryField.create({
            key: "conditionType",
            label: "Condition Type",
            type: "text",
        }),
        Field.create({
            key: "dogtagLevel",
            label: "Dogtag Level",
            type: "number",
		}),

        Field.create({
            virtual: true,
            label: "Target",
            type: "select",
			options: Array.from(Object.keys(DogTagIdsOptions)),
			initialValue: (data: SchemaData) => {
				for (const [key, value] of Object.entries(DogTagIdsOptions)) {
					if (Array.isArray(value) && Array.isArray(data.target) && allElementsInArray(value, data.target)) {
						return key;
					}
				}
				return null;
			},
			onChange: (data: SchemaData, event: Event) => {
                const target = (event.target as HTMLSelectElement).value;
                const value = DogTagIdsOptions[target as keyof typeof DogTagIdsOptions];
				data.target = value;
            },
        }),
        UnneccesaryField.create({
            key: "dynamicLocale",
            label: "Dynamic Locale",
            type: "boolean",
			order: 200,
			alwaysFillWithDefault: true,
        }),
        UnneccesaryField.create({
            key: "globalQuestCounterId",
            label: "Global Quest Counter ID",
            type: "text",
            order: 200,
        }),
        IdField.create({
            key: "id",
            label: "ID",
            type: "text",
        }),
        UnneccesaryField.create({
            key: "index",
            label: "Index",
            type: "number",
            order: 200,
        }),
        UnneccesaryField.create({
            key: "isEncoded",
            label: "Is Encoded",
            type: "boolean",
        }),
        UnneccesaryField.create({
            key: "maxDurability",
            label: "Max Durability",
            type: "number",
        }),
        UnneccesaryField.create({
            key: "minDurability",
            label: "Min Durability",
            type: "number",
        }),
        Field.create({
            key: "onlyFoundInRaid",
            label: "Only Found In Raid",
            type: "boolean",
        }),
        UnneccesaryField.create({
            key: "parentId",
            label: "Parent ID",
            type: "text",
		}),
		HiddenField.create({
			key: "target",
		}),
        Field.create({
            key: "value",
            label: "Value",
            type: "number",
        }),
    ];
}

export class QuestConditions extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "AvailableForStart",
            label: "Условия для старта",
            type: "array",
            order: 1,
            defaultValue: [],
            arrayItemSchema: createLazySchemaChoicer(
                "questsSchemas.json",
                "*.conditions.AvailableForStart",
				"AvailableForStartCondition",
				{
					onSchemaLoad: commonFunctionForConditions
                }
            ),
        }),
        Field.create({
            key: "AvailableForFinish",
            label: "Условия для завершения",
            type: "array",
            order: 2,
            defaultValue: [],
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
                                return data.conditionType === "HandoverItem" &&
                                Array.isArray(data.target) &&
                                typeof data.target[0] === "string" &&
                                DogTagIds.includes(data.target[0])
							}
						}),
                    ],
                    onSchemaLoad: commonFunctionForConditions,
				},
            ),
        }),
        Field.create({
            key: "Fail",
            label: "Условия провала",
            type: "array",
            order: 3,
            defaultValue: [],
			arrayItemSchema: createLazySchemaChoicer("questsSchemas.json", "*.conditions.Fail", "FailCondition", {
				onSchemaLoad: commonFunctionForConditions,
            }),
        }),
    ];
}
