import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class HideoutAreaCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'areaType',
			label: 'Тип зоны',
			type: 'number',
			order: 7,
			defaultValue: 0
		}),
		Field.create({
			key: 'value',
			label: 'Уровень',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '=='],
			order: 9,
			defaultValue: '>='
		}),
	];
}