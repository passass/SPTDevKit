import { generateUUID24chars } from "@/utils/uuidUtils";
import { type FieldType, type SchemaData, Field, RecordSchema } from "./fields";
import type { FieldContext } from "./fieldsConsts";

export class AdvSelectField extends Field {
	type: FieldType = 'arrayAdvancedSelect';
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
	label = "asd";
	type: FieldType = "advancedSelect";
	getOptionsItems(fieldContext: FieldContext) {
		const res = new Map();
		if (fieldContext.recordSchema.lastSchemaParent instanceof RecordSchema) {
			const schema = fieldContext.recordSchema.lastSchemaParent
			if (schema.has("_id") && schema.has("_tpl"))
				res.set(schema.get("_id"), schema.get("_tpl"))
		}
		if (Array.isArray(fieldContext.recordSchema.parent))
			for (const obj of fieldContext.recordSchema.parent) {
				res.set(obj._id, obj._tpl)
			}

		return res
	}
}


export class parentIdFieldWithParentsOnlyIds extends AdvSelectField {
	key: string = "parentId";
	type: FieldType = "advancedSelect";
	getOptionsItems(fieldContext: FieldContext) {
		const res = new Map();
		if (Array.isArray(fieldContext.recordSchema.parent))
			for (const obj of fieldContext.recordSchema.parent) {
				const id = obj._id ?? obj.id
				res.set(id, id)
			}

		return res
	}
}
