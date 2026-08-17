import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class FindItemCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель (ID предметов)',
			type: 'array',
			order: 7,
			defaultValue: []
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'countInRaid',
			label: 'Считать в рейде',
			type: 'boolean',
			order: 9,
			defaultValue: false
		}),
		Field.create({
			key: 'onlyFoundInRaid',
			label: 'Только найдено в рейде',
			type: 'boolean',
			order: 10,
			defaultValue: false
		}),
		Field.create({
			key: 'isEncoded',
			label: 'Закодировано',
			type: 'boolean',
			order: 11,
			defaultValue: false
		}),
		Field.create({
			key: 'dogtagLevel',
			label: 'Уровень жетона',
			type: 'number',
			order: 12,
			defaultValue: 0
		}),
		Field.create({
			key: 'minDurability',
			label: 'Мин. прочность',
			type: 'number',
			order: 13,
			defaultValue: 0
		}),
		Field.create({
			key: 'maxDurability',
			label: 'Макс. прочность',
			type: 'number',
			order: 14,
			defaultValue: 100
		}),
		Field.create({
			key: 'globalQuestCounterId',
			label: 'ID глобального счетчика квеста',
			type: 'text',
			order: 15,
			defaultValue: ''
		})
	];
}