// src/types/schemas/zones.ts

import { Field, RecordSchema, type FieldType } from "@/types/fields/fields";
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
	alwaysFillWithDefault = true
	type: FieldType = "text"

	getSerializedValue(fieldContent: FieldContext) {
		return fieldContent.recordSchema.get("ZoneId");
	}
}

export class ZoneSchema extends RecordSchema {
	getSchemaLabel(): string {
		const name = this.get("ZoneId");
		return (typeof name === "string" && name !== "") ? name : "Zone";
	}

    static fields: Field[] = [
        Field.create({
            key: "ZoneId",
            type: "text",
			order: 1,
			fillWithDefaultOnCreate: true,
        }),
        ZoneName.create({}),
        Field.create({
            key: "ZoneLocation",
            type: "select",
            options: zoneLocations,
			order: 3,
            fillWithDefaultOnCreate: true,
        }),
        Field.create({
            key: "ZoneType",
            type: "select",
            options: ["placeitem", "visit", "botkillzone", "flarezone"],
            order: 4,
            fillWithDefaultOnCreate: true,
        }),
        Field.create({
            key: "FlareType",
            type: "text",
            order: 5,
            defaultValue: "",
            fillWithDefaultOnCreate: true,
        }),
        Field.create({
            key: "Position",
            type: "object",
            nestedSchema: ZoneVector4Schema,
			order: 6,

			alwaysFillWithDefault: true,
        }),
        Field.create({
            key: "Rotation",
            type: "object",
            nestedSchema: ZoneVector4Schema,
			order: 7,

			alwaysFillWithDefault: true,
        }),
        Field.create({
            key: "Scale",
            type: "object",
            nestedSchema: ZoneVector4Schema,
			order: 8,

			alwaysFillWithDefault: true,
        }),
    ];
}
