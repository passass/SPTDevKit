import { BaseCondition } from "./BaseCondition";
import { Field, AdvSelectField } from "@/types/fields/fields";

export class SellItemToTraderCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		AdvSelectField.create({
			key: 'target',
			label: 'ID предметов',
			order: 7,
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
			key: 'traderId',
			label: 'ID торговца',
			type: 'text',
			order: 9,
		}),
		Field.create({
			key: 'dogtagLevel',
			label: 'Уровень жетона',
			type: 'number',
			order: 10,
			defaultValue: 0
		}),
		Field.create({
			key: 'onlyFoundInRaid',
			label: 'Только найдено в рейде',
			type: 'boolean',
			order: 11,
			defaultValue: false
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
	];
}