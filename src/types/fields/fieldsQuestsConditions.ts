// src/types/fieldsQuestsConditions.ts

import { RecordSchema, Field, VirtualLocalizationField } from "@/types/fields/fields";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";

const virtLocField = VirtualLocalizationField.create({
    label: "name",
    order: 2,
})
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
                [
                    virtLocField,
                ]
            ),
        }),
        Field.create({
            key: "Fail",
            label: "Условия провала",
            type: "array",
            order: 3,
            defaultValue: [],
            arrayItemSchema: createLazySchemaChoicer(
                "questsSchemas.json",
                "*.conditions.Fail",
                "FailCondition"
            ),
        }),
    ];
}
