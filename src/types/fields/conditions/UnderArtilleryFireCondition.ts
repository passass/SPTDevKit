import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class UnderArtilleryFireCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель',
			type: 'text',
			order: 7,
			defaultValue: ''
		}),
	];
}