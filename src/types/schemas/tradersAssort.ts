import { RecordSchema, Field } from "../fields/fields";
import { IdField, AdvSelectField, parentIdField, HiddenField, UnneccesaryField } from "../fields/fieldsClasses";

export class TradersAssortSchema extends RecordSchema {
    fields = [
        Field.create({
            key: "traders",
            label: "test",
            type: "array",
            arrayItemSchema: TraderAssort,
        }),
    ];
}

class TraderAssort extends RecordSchema {
    fields = [
        Field.create({
            key: "trader",
            label: "trader",
            type: "text",
        }),

        AdvSelectField.create({
            key: "items",
            label: "items",
            type: "arrayList",
            arrayItemSchema: ItemAssort,
        }),
    ];
}

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
            storeId: "assorts",
			order: 2,
            defaultValue: "",
            alwaysFillWithDefault: true,
        }),
    ];
}

class ItemAssort extends RecordSchema {
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
        parentIdField.create({
            key: "parentId",
            alwaysFillWithDefault: true,
            label: "Parent ID",
            type: "advancedSelect",
            storeId: "items",
            order: 4,
        }),
        Field.create({ key: "slotId", alwaysFillWithDefault: true, label: "Slot ID", type: "text", order: 5 }),

        Field.create({
            key: "barter_scheme",
            label: "barter_scheme",
            type: "arrayArray",
			alwaysFillWithDefault: true,
            arrayItemSchema: CountTplSchema,
            order: 7,
        }),
        Field.create({
            key: "loyal_level_items",
            label: "loyal_level_items",
            type: "number",
			alwaysFillWithDefault: true,
            defaultValue: 1,
            order: 8,
        }),
        Field.create({
            key: "children",
            label: "children",
            type: "array",
			alwaysFillWithDefault: true,
            order: 9,
        }),
    ];
}
