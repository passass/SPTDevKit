import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class EquipmentCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'equipmentInclusive',
			label: 'Экипировка (включающая)',
			type: 'array',
			order: 7,
			defaultValue: []
		}),
		Field.create({
			key: 'equipmentExclusive',
			label: 'Экипировка (исключающая)',
			type: 'array',
			order: 8,
			defaultValue: []
		}),
		Field.create({
			key: 'IncludeNotEquippedItems',
			label: 'Включать неэкипированные предметы',
			type: 'boolean',
			order: 9,
			defaultValue: false
		}),
	];
}