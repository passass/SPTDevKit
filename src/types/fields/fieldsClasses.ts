import { generateUUID24chars } from "@/utils/uuidUtils";
import { type FieldType, type SchemaData, Field } from "./fields";
import type { FieldContext } from "./fieldsConsts";

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

	alwaysFillWithDefault = true;

	getDefaultValue(data: SchemaData): any {
		return generateUUID24chars()
	}
}

export class parentIdField extends AdvSelectField {
	key: string = "parentId";
	type: FieldType = "advancedSelect";
	getOptionsItems(fieldContext: FieldContext) {
		const res = new Map();
		if (Array.isArray(fieldContext.recordSchema.parent))
			for (const obj of fieldContext.recordSchema.parent) {
				res.set(obj._id, obj._tpl)
			}
		return res
	}
}
