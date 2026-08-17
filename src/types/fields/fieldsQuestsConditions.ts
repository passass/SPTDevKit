// src/types/fieldsQuestsConditions.ts

import { RecordSchema, Field } from "@/types/fields/fields";
import { AvailableForStartCondition } from "./conditions/AvailableForStartCondition";
import { AvailableForFinishCondition } from "./conditions/AvailableForFinishCondition";
import { FailCondition } from "./conditions/FailCondition";

export class QuestConditions extends RecordSchema {
	static fields: Field[] = [
		Field.create({
			key: 'AvailableForStart',
			label: 'Условия для старта',
			type: 'array',
			order: 1,
			defaultValue: [],
			arrayItemSchema: AvailableForStartCondition
		}),
		Field.create({
			key: 'AvailableForFinish',
			label: 'Условия для завершения',
			type: 'array',
			order: 2,
			defaultValue: [],
			arrayItemSchema: AvailableForFinishCondition
		}),
		Field.create({
			key: 'Fail',
			label: 'Условия провала',
			type: 'array',
			order: 3,
			defaultValue: [],
			arrayItemSchema: FailCondition
		})
	];
}