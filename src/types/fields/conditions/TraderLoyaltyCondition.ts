import { BaseCondition } from "./BaseCondition";
import { Field, AdvSelectField } from "@/types/fields/fields";

export class TraderLoyaltyCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'ID торговца',
			type: 'text',
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Уровень лояльности',
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