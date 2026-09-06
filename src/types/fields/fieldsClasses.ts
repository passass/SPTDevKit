import { generateUUID24chars } from "@/utils/uuidUtils";
import { type FieldType, type SchemaData, Field } from "./fields";

export class AdvSelectField extends Field {
	type: FieldType = 'arrayAdvancedSelect';

	storeId!: string;
}

export class HiddenField extends Field {
	hidden = true;
}

export class UnneccesaryField extends Field {
	unneccesary = true;
}

export class IdField extends Field {
	type: FieldType = "text"
	editable: boolean = false;
	label: string = 'ID';
	order = 1;

	getDefaultValue(data: SchemaData) {
		return generateUUID24chars()
	}
}
