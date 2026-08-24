// src/types/conditions/HandoverItemCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field, HiddenField, AdvSelectField } from "@/types/fields/fields";

export class HandoverItemCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		AdvSelectField.create({
			key: 'target',
			label: 'Цель (ID предмета)',
			order: 7,
			defaultValue: [],
			
			type: 'arrayAdvancedSelect',
			storeId: "items",
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'onlyFoundInRaid',
			label: 'Только найдено в рейде',
			type: 'boolean',
			order: 9,
			defaultValue: false
		}),
		Field.create({
			key: 'isEncoded',
			label: 'Закодировано',
			type: 'boolean',
			order: 10,
			defaultValue: false
		}),
		Field.create({
			key: 'dogtagLevel',
			label: 'Уровень жетона',
			type: 'number',
			order: 11,
			defaultValue: 0
		}),
		Field.create({
			key: 'minDurability',
			label: 'Мин. прочность',
			type: 'number',
			order: 12,
			defaultValue: 0
		}),
		Field.create({
			key: 'maxDurability',
			label: 'Макс. прочность',
			type: 'number',
			order: 13,
			defaultValue: 100
		}),
		Field.create({
			key: 'globalQuestCounterId',
			label: 'ID глобального счетчика квеста',
			type: 'text',
			order: 14,
			defaultValue: ''
		})
	];
}