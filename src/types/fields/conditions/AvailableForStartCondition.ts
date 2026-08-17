// src/types/conditions/AvailableForStartCondition.ts

import { SchemaChoicer, type SchemaChoice } from "../fieldsSchemaChoicer";
import { LevelCondition } from "./LevelCondition";
import { QuestCondition } from "./QuestCondition";
import { RecordSchema } from "@/types/fields/fields";

export class AvailableForStartCondition extends SchemaChoicer {
	static schemas: SchemaChoice[] = [
		{
			name: "LevelCondition",
			condition: (data: any) => data["conditionType"] === "Level",
			schema: LevelCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "Level"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
		{
			name: "QuestCondition",
			condition: (data: any) => data["conditionType"] === "Quest",
			schema: QuestCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "Quest"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
	]
}