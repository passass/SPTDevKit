import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";
import { RecordSchema } from "@/types/fields/fields";

export class WeaponAssemblyCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'ID оружия',
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
			key: 'containsItems',
			label: 'Содержит предметы',
			type: 'array',
			order: 9,
			defaultValue: []
		}),
		Field.create({
			key: 'hasItemFromCategory',
			label: 'Имеет предмет из категории',
			type: 'array',
			order: 10,
			defaultValue: []
		}),
		Field.create({
			key: 'durability',
			label: 'Прочность',
			type: 'object',
			order: 11,
			nestedSchema: class DurabilitySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'ergonomics',
			label: 'Эргономика',
			type: 'object',
			order: 12,
			nestedSchema: class ErgonomicsSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'recoil',
			label: 'Отдача',
			type: 'object',
			order: 13,
			nestedSchema: class RecoilSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '<=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'effectiveDistance',
			label: 'Эффективная дистанция',
			type: 'object',
			order: 14,
			nestedSchema: class EffectiveDistanceSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'weight',
			label: 'Вес',
			type: 'object',
			order: 15,
			nestedSchema: class WeightSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '<=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'width',
			label: 'Ширина',
			type: 'object',
			order: 16,
			nestedSchema: class WidthSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '<=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'height',
			label: 'Высота',
			type: 'object',
			order: 17,
			nestedSchema: class HeightSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '<=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'magazineCapacity',
			label: 'Емкость магазина',
			type: 'object',
			order: 18,
			nestedSchema: class MagazineCapacitySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'baseAccuracy',
			label: 'Базовая точность',
			type: 'object',
			order: 19,
			nestedSchema: class BaseAccuracySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'muzzleVelocity',
			label: 'Скорость пули',
			type: 'object',
			order: 20,
			nestedSchema: class MuzzleVelocitySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'emptyTacticalSlot',
			label: 'Пустой тактический слот',
			type: 'object',
			order: 21,
			nestedSchema: class EmptyTacticalSlotSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
	];
}