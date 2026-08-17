import { SchemaChoicer, type SchemaChoice } from "../fieldsSchemaChoicer.ts";
import { HandoverItemCondition } from "./HandoverItemCondition.ts";
import { CounterCreatorCondition } from "./CounterCreatorCondition.ts";
import { FindItemCondition } from "./FindItemCondition.ts";
import { QuestCondition } from "./QuestCondition.ts";
import { RecordSchema } from "../fields.ts";

export class AvailableForFinishCondition extends SchemaChoicer {
	static schemas: SchemaChoice[] = [
		{
			name: "HandoverItemCondition",
			condition: (data: any) => data["conditionType"] === "HandoverItem",
			schema: HandoverItemCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "HandoverItem"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
		{
			name: "CounterCreatorCondition",
			condition: (data: any) => data["conditionType"] === "CounterCreator",
			schema: CounterCreatorCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "CounterCreator"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
		{
			name: "FindItemCondition",
			condition: (data: any) => data["conditionType"] === "FindItem",
			schema: FindItemCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "FindItem"),
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