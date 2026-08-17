import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class LocationCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Локации',
			type: 'array',
			order: 7,
			defaultValue: []
		})
	];
}