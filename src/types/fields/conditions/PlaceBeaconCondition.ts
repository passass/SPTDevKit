import { BaseCondition } from "./BaseCondition";
import { Field, ItemField } from "@/types/fields/fields";

export class PlaceBeaconCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		ItemField.create({
			key: 'target',
			label: 'Цель (ID предмета)',
			order: 7,
			type: 'arrayItemChoice',
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
			key: 'zoneId',
			label: 'ID зоны',
			type: 'text',
			order: 9,
		}),
		Field.create({
			key: 'plantTime',
			label: 'Время установки (сек)',
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