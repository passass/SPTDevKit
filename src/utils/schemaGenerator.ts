// src/utils/schemaGenerator.ts

import { RecordSchema, Field, idsFields, type FieldType, AdvSelectField } from "@/types/fields/fields";
import { IdField } from "@/types/fields/fieldsClasses";
import { SchemaChoicer, type SchemaChoice, createSchemaChoiceForCondition } from "@/types/fields/fieldsSchemaChoicer";
import { useFileDataStore } from "@/stores/fileStore";


interface FieldInfo {
    __type?: string;
    key: string;
    data_type?: string;

	rel_path?: string;

	array_nested?: Record<string, FieldInfo>;
	options?: string[];

	hidden: boolean;
	nested_schema: Record<string, FieldInfo>;
	unneccesary?: boolean;

	inputType?: FieldType;
	storeId?: string;

    [key: string]: any;
}

export type GeneratedSchema = typeof RecordSchema | typeof SchemaChoicer;

export interface SchemaNode {
    name: string;
	path?: string;
    schema: GeneratedSchema;
    children: SchemaNode[];
    parent?: SchemaNode;
    type: 'record' | 'choicer' | 'root';
}

function mapDataType(dataType: string): Field['type'] {
    const map: Record<string, Field['type']> = {
        'str': 'text',
        'int': 'number',
        'float': 'number',
        'bool': 'boolean',
        'list': 'array',
        'dict': 'object',
        'select': 'select',
        'arrayAdvancedSelect': 'arrayAdvancedSelect',
        'arrayArrayAdvancedSelect': 'arrayArrayAdvancedSelect',
        'advancedSelect': 'advancedSelect',

        'stringArray': 'stringArray',
        'numberArray': 'numberArray',

		'optionsArray': 'optionsArray',
        'array': 'array',
        'object': 'object'
    };
    return map[dataType] || 'text';
}

const unneccesaryFields = [
	"visibilityConditions"
]

function generateFieldClass(fieldName: string, fieldInfo: FieldInfo, lastSplitSchema: any): Field | null {
    if (idsFields.includes(fieldInfo.key)) {
        return IdField.create({
            key: fieldInfo.key,
            label: fieldInfo.label || fieldName,
            order: 0,
        });
    }

	const commonFields = {
		defaultValue: fieldInfo.defaultValue,
        key: fieldInfo.key ?? fieldName,
        label: fieldInfo.label ?? fieldName,
        order: fieldInfo.order ?? 99,
		unneccesary: fieldInfo.unneccesary ?? (unneccesaryFields?.includes(fieldInfo?.split_key_value) || unneccesaryFields.includes(fieldInfo.key)),
		editable: fieldInfo.editable !== undefined ? fieldInfo.editable : true,
		options: undefined as string[] | undefined,
        hidden: !!fieldInfo.hidden as boolean,
    };

    if (fieldInfo.__type === "nested_schema") {
        const nestedClass = generateNestedSchema(`${fieldName}NestedSchema`, fieldInfo.nested_schema, lastSplitSchema);
        return Field.create({
            ...commonFields,
            type: 'object',
            hidden: fieldInfo.hidden,
            nestedSchema: nestedClass
        });
    }

    if (!fieldInfo.__type && typeof fieldInfo === 'object' && fieldInfo !== null && !Array.isArray(fieldInfo)) {
        const nestedClass = generateNestedSchema(`${fieldName}NestedSchema`, fieldInfo as Record<string, FieldInfo>, lastSplitSchema);
        return Field.create({
            ...commonFields,
            type: 'object',
            hidden: fieldInfo.hidden,
            nestedSchema: nestedClass
        });
    }

	if (fieldInfo.__type === "split_path_child") {
		const childObject: any = Object.values(lastSplitSchema.childs).find((el: any) => el.rel_path == fieldInfo.rel_path)
		if (childObject?.__type === "split_path_child"
			&& childObject?.value?.__type === "split_path"
		) {
			const childSplitObject = processSplitPath(
				childObject.value
				, fieldName + "child"
			)

			if (childSplitObject.schema)
				return Field.create({
					...commonFields,
					type: 'array',
					arrayItemSchema: childSplitObject.schema
				})
		}
		return null
	}
	if (fieldInfo.__type !== "field")
		return null;

    const dataType = mapDataType(fieldInfo.data_type || 'unknown');

    if (dataType === 'array' && fieldInfo.array_nested) {
        // Вложенная схема генерируется рекурсивно
        const nestedClass = generateNestedSchema(`${fieldName}NestedSchema`, fieldInfo.array_nested, lastSplitSchema);

        return Field.create({
            ...commonFields,
            type: 'array',
            arrayItemSchema: nestedClass
        });
    }

    if (fieldInfo.options)
        commonFields.options = fieldInfo.options;

    if (fieldInfo.key === "traderId")
        return AdvSelectField.create({
            ...commonFields,
            type: 'advancedSelect',
			storeId: "traders",
        });

	if (fieldInfo.storeId) {
		return AdvSelectField.create({
			...commonFields,
			type: dataType,
			storeId: fieldInfo.storeId,
		});
	}

    return Field.create({
        ...commonFields,
        type: dataType,
    });
}

function generateNestedSchema(className: string, fields: Record<string, FieldInfo>, lastSplitSchema: any): typeof RecordSchema {
    const generatedFields: Field[] = [];

    for (const [fieldKey, fieldInfo] of Object.entries(fields)) {
        if (typeof fieldInfo === 'object' && fieldInfo !== null && !Array.isArray(fieldInfo)) {
            const field = generateFieldClass(fieldKey, fieldInfo, lastSplitSchema);
            if (field) generatedFields.push(field);
        }
    }

    class GeneratedSchema extends RecordSchema {
        static fields: Field[] = generatedFields;
	}

	GeneratedSchema.getFieldByKeyStatic("")

    return GeneratedSchema;
}

export function generateSchemaChoicer(className: string, schemas: Map<string, typeof RecordSchema>, split_key: string): typeof SchemaChoicer {
    const schemaChoices: SchemaChoice[] = [];

    for (const [name, schemaClass] of schemas) {
        const conditionType = name.replace('Schema', '');

		schemaChoices.push(createSchemaChoiceForCondition({
			name: name,
			schema: schemaClass,
			conditionType: conditionType,
			fieldNameArg: split_key
		}))
    }

    class GeneratedSchemaChoicer extends SchemaChoicer {
        static schemas: SchemaChoice[] = schemaChoices;
    }

    return GeneratedSchemaChoicer;
}

// ===== РЕКУРСИВНАЯ ГЕНЕРАЦИЯ СХЕМ =====
function processSplitPath(
    schema: any,
    nodeName: string,
    parentNode?: SchemaNode
): SchemaNode {
    const node: SchemaNode = {
        name: nodeName,
        schema: null as any,
        children: [],
        parent: parentNode,
        type: 'root',
		path: schema.path,
    };

    if (schema.fields) {
        const schemaChoices: Map<string, typeof RecordSchema> = new Map();

        for (const [fieldName, fieldData] of Object.entries(schema.fields)) {
            if (typeof fieldData === 'object' && fieldData !== null) {
                const fieldInfos = fieldData as Record<string, FieldInfo>;
				const className = fieldName;

				for (const field of Object.values(fieldInfos)) {
					if (field.key === schema.split_key) {
						field.hidden = true;
					}
				}

				const GeneratedSchema = generateNestedSchema(className, fieldInfos, schema)

                const childNode: SchemaNode = {
                    name: className,
                    schema: GeneratedSchema,
                    children: [],
                    parent: node,
                    type: 'record'
                };
                node.children.push(childNode);
                schemaChoices.set(className, GeneratedSchema);
            }
        }

        // Если есть несколько схем, создаем SchemaChoicer
        if (schemaChoices.size > 0) {
            const choicerName = `${schema.split_key}Choicer`;
            const choicerClass = generateSchemaChoicer(choicerName, schemaChoices, schema.split_key);
            // Заменяем дочерние узлы на один узел-выборщик
            const choicerNode: SchemaNode = {
                name: choicerName,
                schema: choicerClass,
                children: node.children,
                parent: node,
                type: 'choicer'
            };

            // Обновляем parent для дочерних узлов
            for (const child of choicerNode.children) {
                child.parent = choicerNode;
            }

			node.schema = choicerClass
        }
    }

    // Рекурсивно обрабатываем childs
    if (schema.childs) {
        for (const [childKey, childData] of Object.entries(schema.childs)) {
            if (
                childData
                && typeof childData === 'object'
                && 'value' in childData
                && childData.value
                && typeof childData.value === 'object'
                && '__type' in childData.value
                && childData.value.__type === 'split_path'
            ) {
                const childNode = processSplitPath(
                    childData.value,
                    childKey,
                    node
                );
                node.children.push(childNode);
            }
        }
    }

    return node;
}

export async function generateSchemaInFile(filePath: string): Promise<GeneratedSchema | undefined | null> {
	return (await generateSchemasInFile(filePath)).children[0]?.schema
}

export async function generateSchemasInFile(filePath: string): Promise<SchemaNode> {
	const fileStore = useFileDataStore();
	const outputJson = await fileStore.read(filePath);
	return generateAllSchemas(outputJson.data)
}

export function generateAllSchemas(outputJson: any): SchemaNode {
    const rootNode: SchemaNode = {
        name: 'Root',
        schema: null as any,
        children: [],
        type: 'root'
    };

    if (typeof outputJson !== "object" || !outputJson.all_schemas || !Array.isArray(outputJson.all_schemas)) {
        return rootNode;
    }

    for (const schema of outputJson.all_schemas) {
        if (schema.__type === 'split_path') {
            const node = processSplitPath(schema, schema.split_key || 'split_path', rootNode);
            rootNode.children.push(node);
        } else if (schema.__type === "nested_schema") {
			const GeneratedSchema = generateNestedSchema(schema.key, schema.nested_schema, rootNode)

			const childNode: SchemaNode = {
				name: "GeneratedSchema",
				schema: GeneratedSchema,
				children: [],
				parent: rootNode,
				type: 'record'
			};

            rootNode.children.push(childNode);
		}
    }

    return rootNode;
}

export function flattenTree(node: SchemaNode): SchemaNode[] {
    const result: SchemaNode[] = [node];
    for (const child of node.children) {
        result.push(...flattenTree(child));
    }
    return result;
}

export function printTree(node: SchemaNode, indent: string = ''): void {
    const typeLabel = node.type === 'root' ? '📁' : node.type === 'choicer' ? '🔀' : '📄';
    const nameLabel = node.schema ? `${node.name} (${node.schema.name})` : node.name;
    console.log(`${indent}${typeLabel} ${nameLabel}`);

    for (const child of node.children) {
        printTree(child, indent + '  ');
    }
}
