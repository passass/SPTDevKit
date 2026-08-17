import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";
import { RecordSchema } from "@/types/fields/fields";

export class KillsCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель (Any, AnyPmc, Bear, Usec, Savage)',
			type: 'select',
			options: ['Any', 'AnyPmc', 'Bear', 'Usec', 'Savage'],
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '==', '>', '<'],
			order: 9,
			defaultValue: '>='
		}),
		Field.create({
			key: 'distance',
			label: 'Дистанция',
			type: 'object',
			order: 10,
			nestedSchema: class DistanceSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'daytime',
			label: 'Время суток',
			type: 'object',
			order: 11,
			nestedSchema: class DaytimeSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'from', type: 'number', label: 'С часа', defaultValue: 0 }),
					Field.create({ key: 'to', type: 'number', label: 'До часа', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'bodyPart',
			label: 'Части тела',
			type: 'array',
			order: 12,
			defaultValue: [],
			options: ['Head', 'Chest', 'Stomach', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg']
		}),
		Field.create({
			key: 'weapon',
			label: 'ID оружия',
			type: 'array',
			order: 13,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponCaliber',
			label: 'Калибр оружия',
			type: 'array',
			order: 14,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponModsExclusive',
			label: 'Моды оружия (исключающие)',
			type: 'array',
			order: 15,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponModsInclusive',
			label: 'Моды оружия (включающие)',
			type: 'array',
			order: 16,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyEquipmentExclusive',
			label: 'Экипировка врага (исключающая)',
			type: 'array',
			order: 17,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyEquipmentInclusive',
			label: 'Экипировка врага (включающая)',
			type: 'array',
			order: 18,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyHealthEffects',
			label: 'Эффекты здоровья врага',
			type: 'array',
			order: 19,
			defaultValue: []
		}),
		Field.create({
			key: 'savageRole',
			label: 'Роли Scav',
			type: 'array',
			order: 20,
			defaultValue: []
		}),
		Field.create({
			key: 'resetOnSessionEnd',
			label: 'Сброс при завершении сессии',
			type: 'boolean',
			order: 21,
			defaultValue: false
		}),
	];
}