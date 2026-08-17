// src/types/conditions/CompleteCondition.ts

import { RecordSchema, Field } from "@/types/fields/fields";
import { IdField } from "../fieldsClasses";

export class CompleteCondition extends RecordSchema {
	static fields: Field[] = [
		Field.create({
			key: 'conditionType',
			label: 'Тип условия',
			type: 'text',
			order: 1,
			defaultValue: 'CompleteCondition',
			editable: false
		}),
		Field.create({
			key: 'target',
			label: 'ID условия',
			type: 'text',
			order: 2
		}),
		IdField.create({
			key: 'id',
		})
	];
}