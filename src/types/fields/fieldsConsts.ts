import type { Field, RecordSchema, SchemaData } from "./fields";
import { Navigator } from "@/utils/navigation";

export interface FieldContext {
	field: Field;
	value: any;
	recordSchema: RecordSchema;
	data: SchemaData;
	navigate: Navigator["navigate"];
}
