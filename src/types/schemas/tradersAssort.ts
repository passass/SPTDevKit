import { RecordSchema, Field, type SchemaData, type FieldType } from "../fields/fields";
import { IdField, AdvSelectField, parentIdField, HiddenField, UnneccesaryField } from "../fields/fieldsClasses";
import { slotIdOptions } from "@/consts/GameConsts";
import { gameLocalization } from "../localization";
import type { FieldContext } from "../fields/fieldsConsts";
import { useDataStore, type dataMapRecordType } from "@/stores/dataStore";
import { currentProjectTag } from "@/consts/ProjectConsts";
import { assortDataStore } from "@/project/TradersAssort";

class RepairableNestedSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "MaxDurability", label: "MaxDurability", type: "number", defaultValue: 100 }),
        Field.create({ key: "Durability", label: "Durability", type: "number", defaultValue: 100 }),
    ];
}

class FireModeNestedSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "FireMode", label: "FireMode", type: "select", options: ["fullauto", "single", "burst"] }),
    ];
}

class UpdNestedSchema extends RecordSchema {
    static fields: Field[] = [
        HiddenField.create({
            key: "Repairable",
            label: "Repairable",
            type: "object",
            nestedSchema: RepairableNestedSchema,
            order: 1,
        }),
        HiddenField.create({
            key: "FireMode",
            label: "FireMode",
            type: "object",
            nestedSchema: FireModeNestedSchema,
            order: 2,
        }),
        UnneccesaryField.create({
            key: "UnlimitedCount",
            label: "UnlimitedCount",
            type: "boolean",
            defaultValue: true,
            alwaysFillWithDefault: true,
            order: 3,
        }),
        UnneccesaryField.create({
            key: "StackObjectsCount",
            label: "StackObjectsCount",
            type: "number",
            defaultValue: 9999,
            alwaysFillWithDefault: true,
            order: 4,
        }),
        Field.create({
            key: "BuyRestrictionMax",
            label: "BuyRestrictionMax",
            type: "number",
            defaultValue: 0,
            alwaysFillWithDefault: true,
            order: 5,
        }),
        UnneccesaryField.create({
            key: "BuyRestrictionCurrent",
            label: "BuyRestrictionCurrent",
            type: "number",
            defaultValue: 0,
            alwaysFillWithDefault: true,
            order: 6,
        }),
    ];
}

export class CountTplSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "count",
            label: "Количество",
            type: "number",
            order: 1,
            defaultValue: 1,
            alwaysFillWithDefault: true,
        }),
        AdvSelectField.create({
            key: "_tpl",
            label: "Шаблон",
            type: "advancedSelect",
            storeId: "items",
            order: 2,
            defaultValue: "",
            alwaysFillWithDefault: true,
        }),
    ];
}

class HideOutFillField extends HiddenField {
    alwaysFillWithDefault = true;
    getDefaultValue(data: SchemaData) {
        return "hideout";
    }
}

export class ItemSlotSchema extends RecordSchema {
    static fields: Field[] = [
        IdField.create({
            key: "_id",
            label: "ID",
            order: 1,
        }),
        AdvSelectField.create({
            key: "_tpl",
            label: "Шаблон",
            type: "advancedSelect",
            storeId: "items",
            order: 2,
            alwaysFillWithDefault: true,
            defaultValue: "",
        }),
        parentIdField.create({
            key: "parentId",
            label: "Parent ID",
            type: "advancedSelect",
            storeId: "items",
            order: 3,
        }),
        Field.create({
            key: "slotId",
            label: "Slot ID",
            type: "select",
            options: slotIdOptions,
            order: 4,
        }),
    ];
}

export class ItemAssort extends RecordSchema {
	getRepresentation(): string {
		return gameLocalization.getText({localeId: `${this.get("_tpl") as string} Name`})
	}

    static fields: Field[] = [
        IdField.create({ key: "_id" }),
        AdvSelectField.create({
            key: "_tpl",
            alwaysFillWithDefault: true,
            label: "Template",
            type: "advancedSelect",
            storeId: "items",
            order: 2,
        }),
        Field.create({
            key: "upd",
            label: "Upd",
            alwaysFillWithDefault: true,
            type: "object",
            nestedSchema: UpdNestedSchema,
            order: 3,
        }),
        HideOutFillField.create({
            key: "parentId",
        }),
        HideOutFillField.create({ key: "slotId" }),

        Field.create({
            key: "barter_scheme",
            label: "barter_scheme",
            type: "arrayArray",
            alwaysFillWithDefault: true,
            arrayItemSchema: CountTplSchema,
            order: 7,
            excludeFromToJSON: true,
        }),
        HiddenField.create({
            key: "traderId",
            label: "traderId",
            alwaysFillWithDefault: true,
            defaultValue: 1,
            order: 8,

            excludeFromToJSON: true,
        }),
        Field.create({
            key: "loyal_level_items",
            label: "loyal_level_items",
            type: "number",
            alwaysFillWithDefault: true,
            defaultValue: 1,
            order: 8,

            excludeFromToJSON: true,
        }),
        Field.create({
            key: "children",
            label: "children",
            type: "array",
            alwaysFillWithDefault: true,
            order: 9,
            arrayItemSchema: ItemSlotSchema,

            excludeFromToJSON: true,
        }),
    ];
}

class arrayListTraderAssort extends Field {
    key = "items";
    label = "items";
    type: FieldType = "arrayList";
    storeId = "TraderAssort";
    arrayItemSchema = ItemAssort;
    alwaysFillWithDefault = true;
	extractWeaponBuildIntoChildren = true;

	onArrayItemDelete(fieldContext: FieldContext, index: number): void {
		const id = fieldContext.value[index].get("_id")
		const store = assortDataStore.getArray()
		const findIndex = store.findIndex((el: dataMapRecordType) => el.data.get("_id") === id)
		if (findIndex)
			assortDataStore.remove(findIndex)
	}

	onExtractWeaponBuildIntoChildren(fieldContext: FieldContext, newVal: SchemaData): void {
		newVal["traderId"] = fieldContext.recordSchema.get("trader")
		const dataStore = useDataStore();
		const schemaType = dataStore.getSchemaType(this.storeId);

        if (schemaType) {
            const newSchema = schemaType.from(newVal);

            if (newSchema)
                dataStore.addSchema(this.storeId, newSchema, newSchema?.getId(), currentProjectTag);
        }
    }
}

class TraderAssort extends RecordSchema {
    getRepresentation(): string {
        return gameLocalization.getText({
            localeId: `${this.get("trader")} Nickname`,
        });
    }

    static fields = [
        AdvSelectField.create({
            key: "trader",
            label: "trader",
            type: "advancedSelect",
            storeId: "traders",
            alwaysFillWithDefault: true,
            defaultValue: "",
        }),

        arrayListTraderAssort.create({}),
    ];
}

export class TradersAssortSchema extends RecordSchema {
    static fields = [
        Field.create({
            key: "traders",
            label: "test",
            type: "array",
            arrayItemSchema: TraderAssort,
        }),
    ];
}
