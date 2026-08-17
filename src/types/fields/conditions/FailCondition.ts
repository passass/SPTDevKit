// src/types/conditions/FailCondition.ts

import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { CounterCreatorCondition } from "./CounterCreatorCondition";
import { RecordSchema } from "@/types/fields/fields";

export class FailCondition extends SchemaChoicer {
	static schemas: SchemaChoice[] = [
		{
			name: "CounterCreatorCondition",
			condition: (data: any) => data["conditionType"] === "CounterCreator",
			schema: CounterCreatorCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "CounterCreator"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
	]
}