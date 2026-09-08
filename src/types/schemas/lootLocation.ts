// src/types/schemas/lootLocation.ts

import { Field, RecordSchema } from "@/types/fields/fields";

export class PositionSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "x", label: "X", type: "number", order: 1 }),
        Field.create({ key: "y", label: "Y", type: "number", order: 2 }),
        Field.create({ key: "z", label: "Z", type: "number", order: 3 }),
    ];
}

export class RotationSchema extends RecordSchema {
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
    static fields: Field[] = [
        Field.create({ key: "key", label: "Ключ", type: "text", order: 1 }),
    ];
}

export class ItemDistributionSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "composedKey", label: "Составной ключ", type: "object", nestedSchema: ComposedKeySchema, order: 1 }),
        Field.create({ key: "relativeProbability", label: "Относительная вероятность", type: "number", order: 2, defaultValue: 1 }),
    ];
}

export class TemplateSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "Id", label: "ID", type: "text", order: 1 }),
        Field.create({ key: "IsContainer", label: "Контейнер", type: "boolean", order: 2, defaultValue: false }),
        Field.create({ key: "useGravity", label: "Гравитация", type: "boolean", order: 3, defaultValue: true }),
        Field.create({ key: "randomRotation", label: "Случайный поворот", type: "boolean", order: 4, defaultValue: false }),
        Field.create({ key: "Position", label: "Позиция", type: "object", nestedSchema: PositionSchema, order: 5 }),
        Field.create({ key: "Rotation", label: "Поворот", type: "object", nestedSchema: RotationSchema, order: 6 }),
        Field.create({ key: "IsGroupPosition", label: "Групповая позиция", type: "boolean", order: 7, defaultValue: false }),
        Field.create({ key: "GroupPositions", label: "Групповые позиции", type: "array", order: 8, defaultValue: [] }),
        Field.create({ key: "IsAlwaysSpawn", label: "Всегда спавнится", type: "boolean", order: 9, defaultValue: false }),
        Field.create({ key: "Root", label: "Корневой ID", type: "text", order: 10 }),
        Field.create({ key: "Items", label: "Предметы", type: "array", arrayItemSchema: ItemSchema, order: 11, defaultValue: [] }),
    ];
}

export class LootLocationSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "locationId", label: "ID локации", type: "text", order: 1 }),
        Field.create({ key: "probability", label: "Вероятность", type: "number", order: 2, defaultValue: 0 }),
        Field.create({ key: "template", label: "Шаблон", type: "object", nestedSchema: TemplateSchema, order: 3 }),
        Field.create({ key: "itemDistribution", label: "Распределение предметов", type: "array", arrayItemSchema: ItemDistributionSchema, order: 4, defaultValue: [] }),
    ];
}
