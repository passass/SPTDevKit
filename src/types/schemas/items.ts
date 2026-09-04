import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
import { Field } from "../fields/fields";
import { VirtualLocalizationField, type SchemaData } from "@/types/fields/fields";


export const itemsSchema = createLazySchemaChoicer(
    "itemsSchemas.json",
    "*",
	"itemsSchemas",
	{
		fields: [
			VirtualLocalizationField.create({
				label: "name",
				order: 2,
				key: "Name",
			}),
			VirtualLocalizationField.create({
				label: "description",
				order: 2,
				key: "Description",
			}),
			VirtualLocalizationField.create({
				label: "shortname",
				order: 2,
				key: "ShortName",
			}),
		]
	}
)
