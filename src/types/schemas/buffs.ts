import { Field, RecordSchema } from "@/types/fields/fields";
import { IdField } from "@/types/fields/fieldsClasses";
import { buffTypes, skills } from "@/consts/GameConsts";

export class BuffSchema extends RecordSchema {
    static fields: Field[] = [
        Field.create({
            key: "AbsoluteValue",
            type: "boolean",
            order: 1,
			defaultValue: true,

			fillWithDefaultOnCreate: true,
		}),
        Field.create({
            key: "BuffType",
            type: "select",
            options: buffTypes,
            order: 2,
            fillWithDefaultOnCreate: true,
        }),
        Field.create({
            key: "Chance",
            type: "number",
            order: 3,
            defaultValue: 1,
            fillWithDefaultOnCreate: true,
        }),
        Field.create({
            key: "Delay",
            type: "number",
            order: 4,
            defaultValue: 1,
            fillWithDefaultOnCreate: true,
        }),
        Field.create({
            key: "Duration",
            type: "number",
            order: 5,
            defaultValue: 60,
            fillWithDefaultOnCreate: true,
        }),
        Field.create({
            key: "SkillName",
            type: "select",
            options: ["", ...skills],
            order: 6,
            defaultValue: "",
            fillWithDefaultOnCreate: true,
        }),
        Field.create({
            key: "Value",
            type: "number",
            order: 7,
            defaultValue: 0,
            fillWithDefaultOnCreate: true,
        }),
    ];
}

export class BuffsSchema extends RecordSchema {
	getRepresentation(): string {
		return (this.get("id") as string) ?? "unknown buff"
	}

    static fields: Field[] = [
        Field.create({ key: "id", type: "text", alwaysFillWithDefault: true }),
        Field.create({
            key: "buffs",
            type: "array",
            order: 2,
			arrayItemSchema: BuffSchema,
            alwaysFillWithDefault: true,
        }),
    ];
}
