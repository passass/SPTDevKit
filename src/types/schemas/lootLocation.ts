// src/types/schemas/lootLocation.ts

import { Field, RecordSchema, type FieldType } from "@/types/fields/fields";
import { IdField } from "../fields/fieldsClasses";
import type { FieldContext } from "../fields/fieldsConsts";
import { getValueByPath, setValueByPath } from "@/utils/utils";
import { lootSpawns } from "@/project/LootSpawns";
import { copyRecordSchema } from "@/utils/copyUtils";
import { currentProjectTag } from "@/consts/ProjectConsts";
import { allLocationsLowerCase } from "@/consts/GameConsts";

export class CoordinatesSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "x", label: "X", type: "number", order: 1 }),
        Field.create({ key: "y", label: "Y", type: "number", order: 2 }),
        Field.create({ key: "z", label: "Z", type: "number", order: 3 }),
    ];
}

export class ItemUpdSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "StackObjectsCount", type: "number", order: 1, defaultValue: 1 }),
    ];
}

export class ItemSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "_id", type: "text", order: 1 }),
        Field.create({ key: "_tpl", type: "text", order: 2 }),
        Field.create({ key: "upd", type: "object", nestedSchema: ItemUpdSchema, order: 3 }),
    ];
}

export class ComposedKeySchema extends RecordSchema {
    static fields: Field[] = [Field.create({ key: "key", type: "text", order: 1 })];
}

export class ItemDistributionSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "composedKey",
            type: "object",
            nestedSchema: ComposedKeySchema,
            order: 1,
        }),
        Field.create({
            key: "relativeProbability",
            type: "number",
            order: 2,
            defaultValue: 1,
        }),
    ];
}

export class GroupCoordinatesSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "Name", type: "text", order: 1 }),
        Field.create({ key: "Weight", type: "number", order: 2, defaultValue: 1 }),
        Field.create({ key: "Position", type: "object", nestedSchema: CoordinatesSchema, order: 3 }),
        Field.create({ key: "Rotation", type: "object", nestedSchema: CoordinatesSchema, order: 4 }),
    ];
}

class GroupPositionField extends Field {
    key = "GroupPositions";
    label = "Групповые позиции";
    type: FieldType = "array";
    arrayItemSchema = GroupCoordinatesSchema;
    order = 8;
    defaultValue = [];
    onArrayItemAdd(fieldContent: FieldContext, newVal: any) {
        const arr = fieldContent.value;
        newVal["Name"] = `groupPoint[${arr.length - 1}]`;
        if (arr.length > 1) newVal["Weight"] = arr[arr.length - 2]["Weight"];
    }
}

export class TemplateSchema extends RecordSchema {
    static fields: Field[] = [
        IdField.create({ key: "Id", type: "text", order: 1 }),
        Field.create({ key: "IsContainer", type: "boolean", order: 2, defaultValue: false }),
        Field.create({ key: "useGravity", type: "boolean", order: 3, defaultValue: true }),
        Field.create({
            key: "randomRotation",
            type: "boolean",
            order: 4,
            defaultValue: false,
        }),
        Field.create({ key: "Position", type: "object", nestedSchema: CoordinatesSchema, order: 5 }),
        Field.create({ key: "Rotation", type: "object", nestedSchema: CoordinatesSchema, order: 6 }),
        Field.create({
            key: "IsGroupPosition",
            type: "boolean",
            order: 7,
            defaultValue: false,
        }),
        GroupPositionField.create({}),
        Field.create({
            key: "IsAlwaysSpawn",
            type: "boolean",
            order: 9,
            defaultValue: false,
        }),
        IdField.create({ key: "Root", type: "text", order: 10 }),
        Field.create({
            key: "Items",
            type: "array",
            arrayItemSchema: ItemSchema,
            order: 11,
            defaultValue: [],
        }),
    ];
}

export class LootLocationSchema extends RecordSchema {
    static fields: Field[] = [
        IdField.create({ key: "locationId", type: "text", order: 1 }),
        Field.create({ key: "probability", type: "number", order: 2, defaultValue: 0 }),
        Field.create({ key: "template", type: "object", nestedSchema: TemplateSchema, order: 3 }),
        Field.create({
            key: "itemDistribution",
            type: "array",
            arrayItemSchema: ItemDistributionSchema,
            order: 4,
            defaultValue: [],
        }),
        Field.create({
            key: "__location",
            type: "select",
            order: 5,
			options: allLocationsLowerCase,
            excludeFromToJSON: true,
        }),
    ];
}

export class LootSpawnsField extends Field {
    type: FieldType = "array";
    virtual = true;
    arrayItemSchema = LootLocationSchema;

    getDefaultValue(data: any) {
        return lootSpawns.getSpawnPointsForItem(data["id"]);
    }

    onArrayItemDelete(fieldContext: FieldContext, index: number): void {
        const value = fieldContext.value[index];
        lootSpawns.removeSpawnPoint(value instanceof RecordSchema ? value.getData() : value);
    }

    onArrayItemAdd(fieldContext: FieldContext, newVal: any): void {
        const location = newVal["__location"];
        setValueByPath(newVal, "template.Items", [
            {
                _id: getValueByPath(newVal, "template.Root"),
                _tpl: fieldContext.recordSchema.getId(),
                upd: {
                    StackObjectsCount: 1,
                },
            },
        ]);
        if (location) {
            lootSpawns.addSpawnPoint(newVal);
        }
    }

    onArrayNavigate(fieldContext: FieldContext, index: number) {
        const schema = LootLocationSchema.from(fieldContext.value[index]);
        if (fieldContext.navigate) fieldContext.navigate(schema);
    }

    onNestedSchemaCopy(fieldContext: FieldContext, oldSchema: RecordSchema) {
        const oldId = oldSchema.getId();
        const newId = fieldContext.recordSchema.getId();
        if (typeof oldId !== "string" || typeof newId !== "string") return;

        for (const spawnPoint of lootSpawns.getSpawnPointsForItem(oldId)) {
            const schema = copyRecordSchema(LootLocationSchema.from(spawnPoint), currentProjectTag);
            setValueByPath(schema.getData(), `template.Items.*[_tpl=${oldId}]._tpl`, newId);
            setValueByPath(
                schema.getData(),
                `template.Root`,
                getValueByPath(schema.getData(), `template.Items.0._id`) ?? "empty"
            );
            lootSpawns.addSpawnPoint(schema.getData());
        }
    }
}
