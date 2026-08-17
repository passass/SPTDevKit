import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class InZoneCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'zoneIds',
			label: 'ID зон',
			type: 'array',
			order: 7,
			defaultValue: []
		}),
	];
}