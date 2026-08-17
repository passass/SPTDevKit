import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";
import { RecordSchema } from "@/types/fields/fields";

export class HealthEffectCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'bodyPartsWithEffects',
			label: 'Части тела с эффектами',
			type: 'array',
			order: 7,
			defaultValue: [],
			arrayItemSchema: class BodyPartsWithEffectsSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'bodyParts', type: 'array', label: 'Части тела', defaultValue: [], options: ['Head', 'Chest', 'Stomach', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg'] }),
					Field.create({ key: 'effects', type: 'array', label: 'Эффекты', defaultValue: [], options: ['Pain', 'Dehydration', 'Intoxication', 'Tremor', 'Stimulator', 'Stun'] }),
				]
			}
		}),
		Field.create({
			key: 'time',
			label: 'Время (сек)',
			type: 'object',
			order: 8,
			nestedSchema: class TimeCompareSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'energy',
			label: 'Энергия',
			type: 'object',
			order: 9,
			nestedSchema: class EnergySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'hydration',
			label: 'Гидратация',
			type: 'object',
			order: 10,
			nestedSchema: class HydrationSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
	];
}