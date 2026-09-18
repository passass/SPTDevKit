import { RecordSchema } from "@/types/fields/fields";

export interface ISelectItem {
	id: string | number;
	label: string;
	record?: Record<string, any> | RecordSchema;
	shownId?: string | number;
}

export interface IOptionItem {
	id: string | number;
	shownId: string | number;
	record: Record<string, any> | RecordSchema;
}
