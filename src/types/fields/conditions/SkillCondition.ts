import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class SkillCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Навык',
			type: 'select',
			options: ['Sniper', 'Health', 'StressResistance', 'Charisma', 'Vitality', 'Attention', 'Search'],
			order: 7,
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