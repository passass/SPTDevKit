import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class VisitPlaceCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель (зона)',
			type: 'text',
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 1
		}),
	];
}