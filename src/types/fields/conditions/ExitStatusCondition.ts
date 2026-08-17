import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class ExitStatusCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'status',
			label: 'Статусы выхода',
			type: 'array',
			order: 7,
			defaultValue: []
		})
	];
}