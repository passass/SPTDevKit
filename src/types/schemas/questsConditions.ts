// src/types/fieldsQuestsConditions.ts

import { RecordSchema, Field, VirtualLocalizationField, AdvSelectField } from "@/types/fields/fields";
import { HiddenField, UnneccesaryField } from "@/types/fields/fieldsClasses";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
import { type SchemaData } from "@/types/fields/fields";
import { createSchemaChoiceForCondition } from "@/types/fields/fieldsSchemaChoicer";
import { allElementsInArray } from "@/utils/utils";
import { IdField } from "../fields/fieldsClasses";
import { DogTagIds, DogTagIdsOptions } from "@/consts/GameConsts";

const virtLocField = VirtualLocalizationField.create({
    label: "name",
    order: 2,
});



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
                "AvailableForStartCondition"
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
                }
            ),
        }),
        Field.create({
            key: "Fail",
            label: "Условия провала",
            type: "array",
            order: 3,
            defaultValue: [],
            arrayItemSchema: createLazySchemaChoicer("questsSchemas.json", "*.conditions.Fail", "FailCondition"),
        }),
    ];
}
