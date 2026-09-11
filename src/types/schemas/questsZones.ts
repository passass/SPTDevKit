// src/types/schemas/zones.ts

import { Field, RecordSchema } from "@/types/fields/fields";
import { HiddenField, IdField } from "@/types/fields/fieldsClasses";
import { zoneLocations } from "@/consts/GameConsts";
import { type FieldContext } from "../fields/fieldsConsts";

export class ZoneVector4Schema extends RecordSchema {
    static fields: Field[] = [
        Field.create({ key: "X", label: "X", type: "text", order: 1, defaultValue: "0", alwaysFillWithDefault: true }),
        Field.create({ key: "Y", label: "Y", type: "text", order: 2, defaultValue: "0", alwaysFillWithDefault: true }),
        Field.create({ key: "Z", label: "Z", type: "text", order: 3, defaultValue: "0", alwaysFillWithDefault: true }),
        Field.create({ key: "W", label: "W", type: "text", order: 4, defaultValue: "0", alwaysFillWithDefault: true }),
    ];
}

class ZoneName extends HiddenField {
	key = "ZoneName"
	getSerializedValue(fieldContent: FieldContext) {
		return fieldContent.recordSchema.get("ZoneId");
	}
}

export class ZoneSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "ZoneId",
            label: "ID зоны",
            type: "text",
			order: 1,
        }),
        ZoneName.create({}),
        Field.create({
            key: "ZoneLocation",
            label: "Локация",
            type: "select",
            options: zoneLocations,
            order: 3,
        }),
        Field.create({
            key: "ZoneType",
            label: "Тип зоны",
            type: "select",
            options: ["placeitem", "visit", "botkillzone", "flarezone"],
            order: 4,
        }),
        Field.create({
            key: "FlareType",
            label: "Тип флаера",
            type: "text",
            order: 5,
            defaultValue: "",
        }),
        Field.create({
            key: "Position",
            label: "Позиция",
            type: "object",
            nestedSchema: ZoneVector4Schema,
			order: 6,

			alwaysFillWithDefault: true,
        }),
        Field.create({
            key: "Rotation",
            label: "Поворот",
            type: "object",
            nestedSchema: ZoneVector4Schema,
			order: 7,

			alwaysFillWithDefault: true,
        }),
        Field.create({
            key: "Scale",
            label: "Масштаб",
            type: "object",
            nestedSchema: ZoneVector4Schema,
			order: 8,

			alwaysFillWithDefault: true,
        }),
    ];
}
