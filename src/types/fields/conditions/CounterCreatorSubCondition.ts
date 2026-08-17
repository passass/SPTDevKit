import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { ArenaMatchPlaceCondition } from "./ArenaMatchPlaceCondition";
import { ArenaGameModeCondition } from "./ArenaGameModeCondition";
import { ExitStatusCondition } from "./ExitStatusCondition";
import { LocationCondition } from "./LocationCondition";
import { RecordSchema } from "@/types/fields/fields";

export class CounterCreatorSubCondition extends SchemaChoicer {
	static schemas: SchemaChoice[] = [
		{
			name: "ArenaMatchPlace",
			condition: (data: any) => data["conditionType"] === "ArenaMatchPlace",
			schema: ArenaMatchPlaceCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "ArenaMatchPlace"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
		{
			name: "ArenaGameMode",
			condition: (data: any) => data["conditionType"] === "ArenaGameMode",
			schema: ArenaGameModeCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "ArenaGameMode"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
		{
			name: "ExitStatus",
			condition: (data: any) => data["conditionType"] === "ExitStatus",
			schema: ExitStatusCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "ExitStatus"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
		{
			name: "Location",
			condition: (data: any) => data["conditionType"] === "Location",
			schema: LocationCondition,
			onSchemaChange: (oldSchema: RecordSchema) => oldSchema.set("conditionType", "Location"),
			onSchemaPostChange: (newSchema: RecordSchema) => newSchema.sanitize(),
		},
	]
}