import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class GlobalVariableValueCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'ID переменной',
			type: 'text',
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Значение',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '==', '>', '<'],
			order: 9,
			defaultValue: '=='
		}),
	];
}