import { Field, RecordSchema, type arrayItemSchemaType, type FieldType, type SchemaData } from "../fields/fields";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
import { SchemaChoicer } from "../fields/fieldsSchemaChoicer";
import { HiddenField, IdField, parentIdField, UnneccesaryField } from "../fields/fieldsClasses";
import type { FieldContext } from "../fields/fieldsConsts";
import { deepClone, getValueByPath, setValueByPath, sum } from "@/utils/utils";
import { rewardsItemsSchema } from "./rewardsItems";
import Items from "@/project/Items";
import { generateUUID24chars } from "@/utils/uuidUtils";
import type { SchemaNode } from "@/utils/schemaGenerator";
import TradersAssort, { assortDataStore } from "@/project/TradersAssort";
import { skills, slotIdOptions } from "@/consts/GameConsts";
import { ItemSlotSchema } from "./tradersAssort";
import { collectDescendants } from "@/utils/treeUtils";
import { useDataStore } from "@/stores/dataStore";
import { objectChangeAllIds, type WeaponBuildItem } from "@/stores/profileStore";
import type { IOptionItem, ISelectItem } from "@/consts/AdvancedSelectInputConsts";
import { ItemsListField } from "./questsConditions";
import { translateId } from "../localization";

class itemTargetFieldClass extends HiddenField {
    key = "target";
    type: FieldType = "text";
    alwaysFillWithDefault = true;
    getSerializedValue(fieldContext: FieldContext) {
        const recordSchema = fieldContext.recordSchema;
        return recordSchema.getValuesByPath("items.*[!parentId]._id")[0];
    }
}

class TemplateAssort extends Field {
    key = "_tpl";
    type: FieldType = "advancedSelect";
    label = "template";

    onOptionChange(
        fieldContext: FieldContext,
        option: ISelectItem
    ): any {
        if (!option.record) return;

        const copiedAssort = deepClone(option.record instanceof RecordSchema ? option.record.getData() : option.record);
        objectChangeAllIds([copiedAssort] as WeaponBuildItem[]);

        fieldContext.recordSchema.set("_id", copiedAssort["_id"]);
        fieldContext.recordSchema.set("children", copiedAssort["children"] ?? []);

        return copiedAssort["_tpl"];
    }

    getOptionsItems(fieldContext: FieldContext): Map<string | number, IOptionItem | RecordSchema | string> {
        const res: Map<string | number, IOptionItem | RecordSchema | string> = new Map();

        const assortSchema = fieldContext.recordSchema.lastSchemaParent;
        if (!assortSchema) return res;
        const traderId = assortSchema.get("traderId");
        if (!traderId || typeof traderId !== "string") return res;

		for (const assort of TradersAssort.getTradersAssortForTraderId(traderId)) {
            if (assort.has("_id"))
                res.set(assort.get("_id") as string, {
                    record: assort,
                    id: assort.get("_tpl") as string,
                    shownId: assort.get("_id") as string,
                });
        }

        return res;
    }
}

class itemsAssortsSchema extends RecordSchema {
    static fields: Field[] = [
        IdField.create({
            key: "_id",
            order: 1,
        }),
        TemplateAssort.create({
            order: 2,
        }),

        HiddenField.create({
            key: "children",
            type: "array",
            order: 3,

            alwaysFillWithDefault: true,
            excludeFromToJSON: true,

            arrayItemSchema: ItemSlotSchema,
        }),
    ];
}

class itemsAssortsFieldClass extends Field {
    key = "items";
    type: FieldType = "array";
    alwaysFillWithDefault = true;
    arrayItemSchema = itemsAssortsSchema;

    getSerializedValue(fieldContext: FieldContext): any {
        const items = fieldContext.value;
        if (!Array.isArray(items)) return items;

        const result: any[] = [];

        for (const item of items) {
            if (!item || typeof item !== "object") continue;

            const data: any = item instanceof RecordSchema ? item.getData() : item;
            if (!data || typeof data !== "object") continue;

            result.push({
                _id: data._id,
                _tpl: data._tpl,
            });

            const children = data.children;
            if (!Array.isArray(children)) continue;

            for (const child of children) {
                if (!child || typeof child !== "object") continue;

                const childData: any = child instanceof RecordSchema ? child.getData() : child;
                if (!childData || typeof childData !== "object") continue;

                const childEntry: Record<string, any> = {
                    _id: childData._id,
                    _tpl: childData._tpl,
                };
                if (childData.parentId !== undefined) childEntry.parentId = childData.parentId;
                if (childData.slotId !== undefined) childEntry.slotId = childData.slotId;

                result.push(childEntry);
            }
        }

        return result;
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
            if (remaining === 0) continue;
            let i = 0;
            while (remaining > 0) {
                const stackSize = Math.min(remaining, maxStack);
                const cloned = deepClone(rewardItem);
                if (i !== 0) cloned["_id"] = generateUUID24chars();
                setValueByPath(cloned, "upd.StackObjectsCount", stackSize);
                result.push(cloned);
                remaining -= stackSize;
                i++;
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

class DynamicLocale extends UnneccesaryField {
    key = "dynamicLocale";
    type: FieldType = "boolean";
    order = 200;
    alwaysFillWithDefault = true;
}
class SkillField extends Field {
	key = "target";
	type: FieldType = "select";
	options = skills;
	alwaysFillWithDefault = true;
}

function commonFunctionForRewards(schemaNode: SchemaNode) {
    const choicer: typeof SchemaChoicer | typeof RecordSchema = schemaNode.schema;
    if (SchemaChoicer.isPrototypeOf(choicer) && "schemas" in choicer && Array.isArray(choicer.schemas)) {
        for (const schema of choicer.schemas) {
            schema.schema.replaceFieldWith(DynamicLocale.create({}));
        }

        const assortmentUnlockSchema = choicer.schemas.find((el) => el.name === "AssortmentUnlock");
        if (assortmentUnlockSchema) {
            assortmentUnlockSchema.schema.replaceFieldWith(
                itemsAssortsFieldClass.create({
                    onIfInData: (data: SchemaData) => {
                        const items = data["items"];
                        if (!Array.isArray(items) || items.length === 0) return;

                        const hasFlatChildren = items.some(
                            (item: any) => item && typeof item === "object" && (item.parentId || item.slotId)
                        );
                        if (!hasFlatChildren) return;

                        const newItems: any[] = [];
                        for (const item of items) {
                            if (!item || typeof item !== "object" || !("_id" in item) || item.parentId || item.slotId)
                                continue;
                            const newItem = {
                                ...item,
                                children:
                                    Array.isArray(item.children) && item.children.length > 0
                                        ? item.children
                                        : collectDescendants(items, String(item._id)),
                            };
                            newItems.push(newItem);
                        }

                        data["items"] = newItems;
                    },
                })
            );
            assortmentUnlockSchema.schema.replaceFieldWith(itemTargetFieldClass.create({}));
        }

		const itemSchema = choicer.schemas.find((el) => el.name === "Item");
		if (itemSchema) {
			itemSchema.schema.replaceFieldWith(itemTargetFieldClass.create({}));
			itemSchema.schema.replaceFieldWith(itemValueFieldClass.create({}));

			const itemsRewardSchema = itemSchema.schema.getFieldByKeyStatic("items")
                ?.arrayItemSchema as typeof RecordSchema;
			if (itemsRewardSchema) {
                itemsRewardSchema.replaceFieldWith(parentIdField.create({}));
            }
		}

		const skillSchema = choicer.schemas.find((el) => el.name === "Skill");
		if (skillSchema) {
			skillSchema.schema.replaceFieldWith(SkillField.create({}))
		}
    }
}

export class RewardsSchemas extends RecordSchema {
    static fields: Field[] = [
        ItemsListField.create({
            key: "Success",
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

                                        const uniqueObjectsMap = new Map<
                                            string,
                                            { count: number; id: string; SpawnedInSession: boolean }
                                        >();
                                        for (const el of uniqueObjects) {
                                            const uniqueObject = uniqueObjectsMap.get(el._tpl);
                                            uniqueObjectsMap.set(el._tpl, {
                                                count:
                                                    (uniqueObject?.count ?? 0) +
                                                    (getValueByPath(el, "upd.StackObjectsCount") ?? 1),
                                                id: uniqueObject?.id ?? el._id,
                                                SpawnedInSession: getValueByPath(el, "upd.SpawnedInSession") ?? false,
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
                                                },
                                            });
                                        }

                                        items.splice(0, items.length, ...result);
                                    },
                                })
                            );
                        }
                    }
                    commonFunctionForRewards(schemaNode);
                },
            }),
        }),
        ItemsListField.create({
            key: "Started",
            arrayItemSchema: createLazySchemaChoicer("questsSchemas.json", "*.rewards.Started", "StartedReward", {
                onSchemaLoad: commonFunctionForRewards,
            }),
        }),
        ItemsListField.create({
            key: "Fail",
            arrayItemSchema: createLazySchemaChoicer("questsSchemas.json", "*.rewards.Fail", "FailReward", {
                onSchemaLoad: commonFunctionForRewards,
            }),
        }),
    ];
}
