import type { ClassType } from "@/utils/classUtils";
import { type SchemaData, RecordSchema } from "./fields"

export type SchemaChoicerConstructor<T extends SchemaChoicer = SchemaChoicer> = new (data?: any) => T;
export interface SchemaChoice {
	name: string,
	condition: (data: SchemaData) => boolean,
	schema: ClassType<RecordSchema>,

	onSchemaChange?: (data: RecordSchema) => void,
	onSchemaPostChange?: (data: RecordSchema) => void,
}

export class SchemaChoicer {
	static schemas: SchemaChoice[] = []

	static getSchema(data: SchemaData): SchemaChoice | null {
		for (const schemaChoice of this.schemas) {
			if (schemaChoice.condition(data)) {
				return schemaChoice
			}
		}
		return null
	}
}

export function createSchemaChoiceForCondition(
	config: {
		name: string;
		schema: ClassType<RecordSchema>;
		conditionType?: string;
		onSchemaChange?: (data: RecordSchema) => void;
		onSchemaPostChange?: (data: RecordSchema) => void;
		condition?: (data: SchemaData) => boolean;
		fieldNameArg?: string;
	}
): SchemaChoice {
	const conditionType = config.conditionType ?? config.name.substring(0, config.name.lastIndexOf("Condition")).trim();
	const fieldName = config.fieldNameArg ?? "conditionType"

	return {
		name: config.name,
		condition: config.condition ?? ((data: any) => data[fieldName] === conditionType),
		schema: config.schema,
		onSchemaChange: config.onSchemaChange, // ?? ((oldSchema: RecordSchema) => oldSchema.set("conditionType", conditionType)),
		onSchemaPostChange: config.onSchemaPostChange ?? ((newSchema: RecordSchema) => {
			newSchema.sanitize()
			newSchema.set(fieldName, conditionType)
		}),
	};
}
