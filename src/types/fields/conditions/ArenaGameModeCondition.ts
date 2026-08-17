// src/types/conditions/ArenaGameModeCondition.ts
import { RecordSchema, Field } from "../fields";
import { IdField } from "../fieldsClasses";

export class ArenaGameModeCondition extends RecordSchema {
	static fields: Field[] = [
		Field.create({
			key: 'conditionType',
			label: 'Тип условия',
			type: 'text',
			order: 1,
			defaultValue: 'ArenaGameMode',
			editable: false
		}),
		IdField.create({
			key: 'id',
			order: 4,
		}),
		Field.create({
			key: 'target',
			label: 'Режимы игры',
			type: 'array',
			order: 99,
			defaultValue: []
		}),
		Field.create({
			key: 'dynamicLocale',
			label: 'Динамическая локализация',
			type: 'boolean',
			order: 99,
			defaultValue: false
		}),
	];
}