// src/types/schemas/lootLocation.ts

import { Field, RecordSchema, type FieldType } from "@/types/fields/fields";
import { IdField } from "../fields/fieldsClasses";
import type { FieldContext } from "../fields/fieldsConsts";
import { getValueByPath, setValueByPath } from "@/utils/utils";
import { useLootSpawns } from "@/project/LootSpawns";

const locations = [
    "bigmap",
    "develop",
    "factory4_day",
    "factory4_night",
    "hideout",
    "interchange",
    "laboratory",
    "labyrinth",
    "lighthouse",
    "privatearea",
    "rezervbase",
    "sandbox",
    "sandbox_high",
    "shoreline",
    "suburbs",
    "tarkovstreets",
    "terminal",
    "town",
    "woods",
];

export class CoordinatesSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "x", label: "X", type: "number", order: 1 }),
        Field.create({ key: "y", label: "Y", type: "number", order: 2 }),
        Field.create({ key: "z", label: "Z", type: "number", order: 3 }),
    ];
}

export class ItemUpdSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "StackObjectsCount", label: "Количество", type: "number", order: 1, defaultValue: 1 }),
    ];
}

export class ItemSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "_id", label: "ID", type: "text", order: 1 }),
        Field.create({ key: "_tpl", label: "Шаблон", type: "text", order: 2 }),
        Field.create({ key: "upd", label: "Обновление", type: "object", nestedSchema: ItemUpdSchema, order: 3 }),
    ];
}

export class ComposedKeySchema extends RecordSchema {
    static fields: Field[] = [Field.create({ key: "key", label: "Ключ", type: "text", order: 1 })];
}

export class ItemDistributionSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "composedKey",
            label: "Составной ключ",
            type: "object",
            nestedSchema: ComposedKeySchema,
            order: 1,
        }),
        Field.create({
            key: "relativeProbability",
            label: "Относительная вероятность",
            type: "number",
            order: 2,
            defaultValue: 1,
        }),
    ];
}

export class GroupCoordinatesSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "Name", label: "Название", type: "text", order: 1 }),
        Field.create({ key: "Weight", label: "Вес", type: "number", order: 2, defaultValue: 1 }),
        Field.create({ key: "Position", label: "Позиция", type: "object", nestedSchema: CoordinatesSchema, order: 3 }),
        Field.create({ key: "Rotation", label: "Поворот", type: "object", nestedSchema: CoordinatesSchema, order: 4 }),
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
		const arr = fieldContent.value
        newVal["Name"] = `groupPoint[${arr.length - 1}]`;
        if (arr.length > 1) newVal["Weight"] = arr[arr.length - 2]["Weight"];
    }
}

export class TemplateSchema extends RecordSchema {
    static fields: Field[] = [
        IdField.create({ key: "Id", label: "ID", type: "text", order: 1 }),
        Field.create({ key: "IsContainer", label: "Контейнер", type: "boolean", order: 2, defaultValue: false }),
        Field.create({ key: "useGravity", label: "Гравитация", type: "boolean", order: 3, defaultValue: true }),
        Field.create({
            key: "randomRotation",
            label: "Случайный поворот",
            type: "boolean",
            order: 4,
            defaultValue: false,
        }),
        Field.create({ key: "Position", label: "Позиция", type: "object", nestedSchema: CoordinatesSchema, order: 5 }),
        Field.create({ key: "Rotation", label: "Поворот", type: "object", nestedSchema: CoordinatesSchema, order: 6 }),
        Field.create({
            key: "IsGroupPosition",
            label: "Групповая позиция",
            type: "boolean",
            order: 7,
            defaultValue: false,
        }),
        GroupPositionField.create({}),
        Field.create({
            key: "IsAlwaysSpawn",
            label: "Всегда спавнится",
            type: "boolean",
            order: 9,
            defaultValue: false,
        }),
        IdField.create({ key: "Root", label: "Корневой ID", type: "text", order: 10 }),
        Field.create({
            key: "Items",
            label: "Предметы",
            type: "array",
            arrayItemSchema: ItemSchema,
            order: 11,
            defaultValue: [],
        }),
    ];
}

export class LootLocationSchema extends RecordSchema {
    static fields: Field[] = [
        IdField.create({ key: "locationId", label: "ID локации", type: "text", order: 1 }),
        Field.create({ key: "probability", label: "Вероятность", type: "number", order: 2, defaultValue: 0 }),
        Field.create({ key: "template", label: "Шаблон", type: "object", nestedSchema: TemplateSchema, order: 3 }),
        Field.create({
            key: "itemDistribution",
            label: "Распределение предметов",
            type: "array",
            arrayItemSchema: ItemDistributionSchema,
            order: 4,
            defaultValue: [],
        }),
        Field.create({
            key: "__location",
            label: "Локация",
            type: "select",
            order: 5,
            options: locations,
        }),
    ];
}

export class LootSpawnsField extends Field {
	type: FieldType = "array"
	virtual = true
	arrayItemSchema = LootLocationSchema

	onUpdateModelValue(recordSchema: RecordSchema, newVal: any) {
		const lootSpawns = useLootSpawns();
		const id = recordSchema.getId()
		if (id) {
			console.log("onUpdateModelValue", lootSpawns.getSpawnPointsForItem(id))
		}
	}

	getDefaultValue(data: any) {
		const lootSpawns = useLootSpawns();
		console.log("getDefaultValue", lootSpawns.getSpawnPointsForItem(data["id"]))
		return lootSpawns.getSpawnPointsForItem(data["id"]);
	}

	onArrayItemDelete(fieldContext: FieldContext, index: number): void {
		const value = fieldContext.value[index];
		const lootSpawns = useLootSpawns();
		lootSpawns.removeSpawnPoint(value instanceof RecordSchema ? value.getData() : value);
	}

	onArrayItemAdd(fieldContext: FieldContext, newVal: any): void {
		const lootSpawns = useLootSpawns();
		const location = newVal["__location"];
		setValueByPath(newVal, "template.Items", [{
			"_id": getValueByPath(newVal, "template.Root"),
            "_tpl": fieldContext.recordSchema.getId(),
            "upd": {
                "StackObjectsCount": 1
            }
		}])
		if (location) {
			lootSpawns.addSpawnPoint(location, newVal);
		}
	}

	onArrayNavigate(fieldContext: FieldContext, index: number) {
		if (fieldContext.navigate) {
			console.log("onArrayNavigate", index, fieldContext.value)
			const schema = RecordSchema.from(fieldContext.value[index], LootLocationSchema)
			fieldContext.navigate(schema)
		}
	}
}
