import { Field, RecordSchema, type FieldType, type SchemaData } from "../fields/fields";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
import { SchemaChoicer } from "../fields/fieldsSchemaChoicer";
import { HiddenField, parentIdField } from "../fields/fieldsClasses";
import type { FieldContext } from "../fields/fieldsConsts";
import { deepClone, getValueByPath, setValueByPath, sum } from "@/utils/utils";
import { rewardsItemsSchema } from "./rewardsItems";
import Items from "@/project/Items";
import { copyRecordSchema } from "@/utils/copyUtils";
import { generateUUID24chars } from "@/utils/uuidUtils";
import { getStaticField } from "@/utils/classUtils";

class itemTargetFieldClass extends HiddenField {
    key = "target";
    type: FieldType = "text";
    alwaysFillWithDefault = true;
    getSerializedValue(fieldContext: FieldContext) {
        const recordSchema = fieldContext.recordSchema;
        return recordSchema.getValuesByPath("items.*[!parentId]._id")[0];
    }
}

class itemItemsFieldClass extends Field {
    key = "items";
    type: FieldType = "array";
    order = 5;
    arrayItemSchema = rewardsItemsSchema;

    alwaysFillWithDefault = true;

    getSerializedValue(fieldContext: FieldContext) {
        const result = [];
        for (const rewardItem of fieldContext.value) {
            const maxStack = Items.getFieldResult(rewardItem["_tpl"] as string, "overrideProperties.StackMaxSize");
            const currentStacks = getValueByPath(rewardItem, "upd.StackObjectsCount");

            if (
                typeof maxStack !== "number" ||
                maxStack <= 0 ||
                typeof currentStacks !== "number" ||
                currentStacks <= 0
            ) {
                result.push(deepClone(rewardItem));
                continue;
            }

            let remaining = currentStacks;
            while (remaining > 0) {
                const stackSize = Math.min(remaining, maxStack);
                const cloned = deepClone(rewardItem);
                cloned["_id"] = generateUUID24chars();
                setValueByPath(cloned, "upd.StackObjectsCount", stackSize);
                result.push(cloned);
                remaining -= stackSize;
            }
        }

        return result;
    }
}

class itemValueFieldClass extends HiddenField {
    key = "value";
    type: FieldType = "number";
    alwaysFillWithDefault = true;
    defaultValue = 0;
    getSerializedValue(fieldContext: FieldContext) {
        return sum(
            fieldContext.recordSchema
                .getValuesByPath("items.*[!parentId]")
                .map((el) => Number(getValueByPath(el, "upd.StackObjectsCount") ?? 1)) as number[]
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
                            itemSchema.schema.replaceFieldWith(
                                itemItemsFieldClass.create({
                                    onIfInData: (data: SchemaData) => {
                                        const items: any[] | undefined = data.items as unknown as any[];
                                        if (!Array.isArray(items)) return;
                                        const hasParents = items
                                            .map((item) => item._id)
                                            .filter((id) => items.find((el) => el.parentId === id));

                                        const hasParentId = items.filter((el) => !!el.parentId).map((item) => item._id);

                                        if (hasParents.length > 0 || hasParentId.length > 0) return;
                                        const uniqueObjects = items.filter(
                                            (el) => !hasParentId.includes(el._id) && !hasParents.includes(el._id)
                                        );

										const uniqueObjectsMap = new Map<string, { count: number; id: string; SpawnedInSession: boolean }>();
                                        for (const el of uniqueObjects) {
                                            const uniqueObject = uniqueObjectsMap.get(el._tpl);
                                            uniqueObjectsMap.set(el._tpl, {
                                                count: (uniqueObject?.count ?? 0) + (getValueByPath(el, "upd.StackObjectsCount") ?? 1),
												id: (uniqueObject?.id ?? el._id),
                                                SpawnedInSession: getValueByPath(el, "upd.SpawnedInSession") ?? false
                                            });
										}

										const result = [];
										for (const [_tpl, value] of uniqueObjectsMap.entries()) {
											result.push({
												_id: value.id,
												_tpl: _tpl,
												upd: {
													StackObjectsCount: value.count,
													SpawnedInSession: value.SpawnedInSession,
												}
											});
										}

										items.splice(0, items.length, ...result);
                                    },
                                })
                            );
                            itemSchema.schema.replaceFieldWith(itemTargetFieldClass.create({}));
                            itemSchema.schema.replaceFieldWith(itemValueFieldClass.create({}));

                            const itemsRewardSchema = itemSchema.schema.getFieldByKeyStatic("items")
                                ?.arrayItemSchema as typeof RecordSchema;
                            if (itemsRewardSchema) {
                                itemsRewardSchema.replaceFieldWith(parentIdField.create({}));
                            }
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
