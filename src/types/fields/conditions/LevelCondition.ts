// src/types/conditions/LevelCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class LevelCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'text',
			order: 7,
			defaultValue: '>='
		}),
		Field.create({
			key: 'value',
			label: 'Уровень',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'globalQuestCounterId',
			label: 'ID глобального счетчика квеста',
			type: 'text',
			order: 9,
			defaultValue: ''
		})
	];
}