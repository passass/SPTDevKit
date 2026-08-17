import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class TimeCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '==', '>', '<'],
			order: 7,
			defaultValue: '>='
		}),
		Field.create({
			key: 'value',
			label: 'Значение (сек)',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
	];
}