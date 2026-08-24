// src/types/conditions/QuestCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field, AdvSelectField } from "@/types/fields/fields";

export class QuestCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		AdvSelectField.create({
			key: 'target',
			label: 'ID квеста',
			order: 7,

			type: "advancedSelect",
			storeId: "quests",
		}),
		Field.create({
			key: 'status',
			label: 'Статус',
			type: 'array',
			order: 8,
			defaultValue: []
		}),
		Field.create({
			key: 'availableAfter',
			label: 'Доступно после времени',
			type: 'number',
			order: 9,
			defaultValue: 0
		}),
		Field.create({
			key: 'dispersion',
			label: 'Разброс',
			type: 'number',
			order: 10,
			defaultValue: 0
		}),
		Field.create({
			key: 'globalQuestCounterId',
			label: 'ID глобального счетчика квеста',
			type: 'text',
			order: 11,
			defaultValue: ''
		})
	];
}