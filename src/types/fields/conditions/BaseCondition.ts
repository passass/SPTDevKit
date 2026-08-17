// src/types/conditions/BaseCondition.ts

import { RecordSchema, Field, HiddenField } from "@/types/fields/fields";
import { VisibilityCondition } from "./VisibilityCondition";
import { IdField } from "../fieldsClasses";


export class BaseCondition extends RecordSchema {
	static fields: Field[] = [
		IdField.create({
			key: 'id'
		}),
		Field.create({
			key: 'index',
			label: 'Индекс',
			type: 'number',
			order: 99
		}),
		Field.create({
			key: 'parentId',
			label: 'Родительский ID',
			type: 'text',
			order: 3
		}),
		HiddenField.create({
			key: 'conditionType',
			label: 'Тип условия',
			order: 4,
			defaultValue: 'FindItem',
			editable: false
		}),
		Field.create({
			key: 'dynamicLocale',
			label: 'Динамическая локализация',
			type: 'boolean',
			order: 99,
			defaultValue: false
		}),
		Field.create({
			key: 'visibilityConditions',
			label: 'Условия видимости',
			type: 'array',
			order: 15,
			defaultValue: [],
			arrayItemSchema: VisibilityCondition
		})
	];
}