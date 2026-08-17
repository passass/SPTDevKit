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