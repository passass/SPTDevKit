import Items from "@/project/Items";
import { Field, RecordSchema, AdvSelectField, type SchemaData } from "@/types/fields/fields";
import { IdField } from "../fields/fieldsClasses";
import { slotIdOptions } from "@/consts/GameConsts";

class FireModeNestedSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "FireMode", type: "text" }),
    ];
}

class FoldableNestedSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "Folded", type: "boolean" }),
    ];
}

class RepairableNestedSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "Durability", type: "number" }),
        Field.create({ key: "MaxDurability", type: "number" }),
    ];
}

class UpdNestedSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "SpawnedInSession", type: "boolean" }),
        Field.create({ key: "StackObjectsCount", type: "number", defaultValue: 1 }),
        Field.create({ key: "FireMode", type: "object", nestedSchema: FireModeNestedSchema }),
        Field.create({ key: "Foldable", type: "object", nestedSchema: FoldableNestedSchema }),
        Field.create({ key: "Repairable", type: "object", nestedSchema: RepairableNestedSchema }),
    ];
}



export class rewardsItemsSchema extends RecordSchema {
    static fields: Field[] = [
        IdField.create({ key: "_id" }),
        AdvSelectField.create({ key: "_tpl", label: "Template", type: "advancedSelect", storeId: "items" }),
        Field.create({ key: "upd", label: "Upd", type: "object", nestedSchema: UpdNestedSchema }),
        AdvSelectField.create({ key: "parentId", label: "Parent ID", type: "advancedSelect", storeId: "items" }),
        Field.create({ key: "slotId", label: "Slot ID", type: "select", options: slotIdOptions }),
    ];
}
