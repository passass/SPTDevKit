// src/types/conditions/CounterCreatorCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";
import { Counter } from "./Counter";

export class CounterCreatorCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'type',
			label: 'Тип',
			type: 'text',
			order: 7,
			defaultValue: 'Completion'
		}),
		Field.create({
			key: 'counter',
			label: 'Счетчик',
			type: 'object',
			order: 8,
			nestedSchema: Counter
		}),
		Field.create({
			key: 'value',
			label: 'Значение',
			type: 'number',
			order: 9,
			defaultValue: 0
		}),
		Field.create({
			key: 'isNecessary',
			label: 'Обязательное',
			type: 'boolean',
			order: 10,
			defaultValue: false
		}),
		Field.create({
			key: 'isResetOnConditionFailed',
			label: 'Сброс при провале',
			type: 'boolean',
			order: 11,
			defaultValue: false
		}),
		Field.create({
			key: 'doNotResetIfCounterCompleted',
			label: 'Не сбрасывать при завершении',
			type: 'boolean',
			order: 12,
			defaultValue: false
		}),
		Field.create({
			key: 'oneSessionOnly',
			label: 'Только за одну сессию',
			type: 'boolean',
			order: 13,
			defaultValue: false
		}),
		Field.create({
			key: 'completeInSeconds',
			label: 'Завершить за секунд',
			type: 'number',
			order: 14,
			defaultValue: 0
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