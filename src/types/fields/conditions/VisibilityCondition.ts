// src/types/conditions/VisibilityCondition.ts

import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { CompleteCondition } from "./CompleteCondition";
import { RecordSchema } from "@/types/fields/fields";

export class VisibilityCondition extends SchemaChoicer {
	static schemas: SchemaChoice[] = [
		{
			name: "CompleteCondition",
			condition: (data: any) => data["conditionType"] === "CompleteCondition",
			schema: CompleteCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "CompleteCondition"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
	]
}