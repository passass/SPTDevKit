// src/types/conditions/Counter.ts

import { RecordSchema, Field } from "@/types/fields/fields";
import { CounterCreatorSubCondition } from "./CounterCreatorSubCondition";
import { IdField } from "../fieldsClasses";

export class Counter extends RecordSchema {
	static fields: Field[] = [
		IdField.create({
			key: 'id',
		}),
		Field.create({
			key: 'conditions',
			label: 'Условия',
			type: 'array',
			order: 2,
			arrayItemSchema: CounterCreatorSubCondition,
			defaultValue: []
		})
	];
}