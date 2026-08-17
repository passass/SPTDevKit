// src/types/conditions/ArenaMatchPlaceCondition.ts
import { RecordSchema, Field } from "@/types/fields/fields";
import { IdField } from "../fieldsClasses";

export class ArenaMatchPlaceCondition extends RecordSchema {
	static fields: Field[] = [
		Field.create({
			key: 'conditionType',
			label: 'Тип условия',
			type: 'text',
			order: 1,
			defaultValue: 'ArenaMatchPlace',
			editable: false
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'text',
			order: 2,
			defaultValue: '=='
		}),
		Field.create({
			key: 'value',
			label: 'Значение',
			type: 'number',
			order: 3,
			defaultValue: 0
		}),
		Field.create({
			key: 'dynamicLocale',
			label: 'Динамическая локализация',
			type: 'boolean',
			order: 4,
			defaultValue: false
		}),
		IdField.create({
			key: 'id',
			order: 5,
		})
	];
}