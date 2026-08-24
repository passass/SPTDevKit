import { generateUUID24chars } from "@/utils/utils";
import { type FieldType, type SchemaData, Field } from "./fields";

export class LocalizationField extends Field {
	type: FieldType = 'localization';

	getDefaultValue(data: SchemaData): string {
		const key = this.key;
		return `${data["_id"]} ${key}`;
	}
}

export class AdvSelectField extends Field {
	type: FieldType = 'arrayAdvancedSelect';

	storeId!: string;
}

export class HiddenField extends Field {}

export class IdField extends Field {
	type: FieldType = "text"
	editable: boolean = false;
	label: string = 'ID';
	order = 1;
 
	getDefaultValue(data: SchemaData) {
		return generateUUID24chars()
	}
}