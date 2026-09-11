import { Field, RecordSchema, type FieldType } from "../fields/fields";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
import { SchemaChoicer } from "../fields/fieldsSchemaChoicer";
import { HiddenField } from "../fields/fieldsClasses";
import type { FieldContext } from "../fields/fieldsConsts";
import { sum } from "@/utils/utils";

class itemTargetFieldClass extends HiddenField {
    key = "target";
    getSerializedValue(fieldContext: FieldContext) {
        const recordSchema = fieldContext.recordSchema;
        return recordSchema.getValueByPath("items.0._id");
    }
}

class itemValueFieldClass extends HiddenField {
    key = "value";
    getSerializedValue(fieldContext: FieldContext) {
        return sum(
            fieldContext.recordSchema
                .getValuesByPath("items.*.upd.StackObjectsCount")
                .map((el) => Number(el)) as number[]
        );
    }
}

export class RewardsSchemas extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "Success",
            label: "Success",
            type: "array",
            order: 1,
            arrayItemSchema: createLazySchemaChoicer("questsSchemas.json", "*.rewards.Success", "SuccessReward", {
                onSchemaLoad: (schemaNode) => {
                    const choicer: typeof SchemaChoicer | typeof RecordSchema = schemaNode.schema;
                    if (
                        SchemaChoicer.isPrototypeOf(choicer) &&
                        "schemas" in choicer &&
                        Array.isArray(choicer.schemas)
                    ) {
                        const itemSchema = choicer.schemas.find((el) => el.name === "Item");
                        if (itemSchema) {
                            itemSchema.schema.replaceFieldWith(itemTargetFieldClass.create({}));
                            itemSchema.schema.replaceFieldWith(itemValueFieldClass.create({}));
                        }
                    }
                },
            }),
        }),
        Field.create({
            key: "Started",
            label: "Started",
            type: "array",
            order: 2,
            arrayItemSchema: createLazySchemaChoicer("questsSchemas.json", "*.rewards.Started", "StartedReward"),
        }),
        Field.create({
            key: "Fail",
            label: "Fail",
            type: "array",
            order: 3,
            arrayItemSchema: createLazySchemaChoicer("questsSchemas.json", "*.rewards.Fail", "FailReward"),
        }),
    ];
}
