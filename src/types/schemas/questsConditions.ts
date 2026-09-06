// src/types/fieldsQuestsConditions.ts

import { RecordSchema, Field, VirtualLocalizationField, AdvSelectField } from "@/types/fields/fields";
import { HiddenField, UnneccesaryField } from "@/types/fields/fieldsClasses";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
import { type SchemaData } from "@/types/fields/fields";
import { createSchemaChoiceForCondition } from "@/types/fields/fieldsSchemaChoicer";
import { allElementsInArray } from "@/utils/utils";
import { IdField } from "../fields/fieldsClasses";

const virtLocField = VirtualLocalizationField.create({
    label: "name",
    order: 2,
});

const DogTagIds: string[] = [
	"59f32bb586f774757e1e8442",
    "6662e9aca7e0b43baa3d5f74",
    "6662e9cda7e0b43baa3d5f76",
    "675dc9d37ae1a8792107ca96",
    "675dcb0545b1a2d108011b2b",
    "684181208d035f60230f63f9",
    "684180bc51bf8645f7067bc8",
	"59f32c3b86f77472a31742f0",
    "6662ea05f6259762c56f3189",
    "6662e9f37fa79a6d83730fa0",
    "6764207f2fa5e32733055c4a",
    "6764202ae307804338014c1a",
    "684180ee9b6d80d840042e8a",
    "68418091b5b0c9e4c60f0e7a"
];

const DogTagIdsOptions = {
	Any: DogTagIds,
	Bear: [
		"59f32bb586f774757e1e8442",
        "6662e9aca7e0b43baa3d5f74",
        "6662e9cda7e0b43baa3d5f76",
        "675dc9d37ae1a8792107ca96",
        "675dcb0545b1a2d108011b2b",
        "684181208d035f60230f63f9",
        "684180bc51bf8645f7067bc8"
	],
	Usec: [
		"59f32c3b86f77472a31742f0",
        "6662ea05f6259762c56f3189",
        "6662e9f37fa79a6d83730fa0",
        "6764207f2fa5e32733055c4a",
        "6764202ae307804338014c1a",
        "684180ee9b6d80d840042e8a",
        "68418091b5b0c9e4c60f0e7a"
	]
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
					if (allElementsInArray(value, data.target)) {
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
