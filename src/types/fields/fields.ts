// src/types/fields.ts
import { Data } from "dataclass";
import { type SchemaChoice, SchemaChoicer } from "./fieldsSchemaChoicer";
import { type ClassType } from "@/utils/classUtils";

export const idsFields: string[] = ['_id', 'id']

export type arrayItemSchemaType = ClassType<RecordSchema>
| ClassType<SchemaChoicer>
| null
export type SchemaData = Record<string, any>
export type FieldType = 'text'
	| 'number'
	| 'boolean'
	| 'textarea'
	| 'select'
	| 'object'
	| 'array'
	| 'stringArray'
	| 'numberArray'
	| 'hidden'
	| 'localization'
	| "advancedSelect"
	| 'arrayAdvancedSelect';

export class Field extends Data {
	key!: string;
	label!: string;
	description?: string = "";
	placeholder?: string = "";
	type!: FieldType;
	visible?: boolean = true;
	editable?: boolean = true;
	order?: number = 1;
	options?: any[];
	defaultValue?: any;
	validate?: (value: any, record: SchemaData) => true | string;
	nestedSchema?: ClassType<RecordSchema>;
	arrayItemSchema?: arrayItemSchemaType;

	getDefaultValue?(data: SchemaData): any;
}

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

export class HiddenField extends Field {
	type: FieldType = 'hidden';
}

export class UnneccesaryField extends Field {}

function autoDetectType(value: any): FieldType {
	if (value === null || value === undefined) return 'text';
	if (Array.isArray(value)) return 'array';
	if (typeof value === 'boolean') return 'boolean';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'string' && value.length > 100) return 'textarea';
	if (typeof value === 'object' || value instanceof RecordSchema) return 'object';
	return 'text';
}

export const isObjectNotArray = (item: any): boolean => typeof item === 'object' && !Array.isArray(item) 
export const isNotRecordSchemaButObject = (el: any): boolean => (
	typeof el === 'object' && !(el instanceof RecordSchema) && !Array.isArray(el) 
)
export const castToRecordSchema = (el: any, recordSchemaType?: ClassType<RecordSchema>, otherData?: recordSchemaOtherData): RecordSchema => (
	isNotRecordSchemaButObject(el)
	? new (recordSchemaType ?? RecordSchema)(el, otherData)
	: el
)

export const castByArrayItemSchema = (
	value: any,
	arrayItemSchema: arrayItemSchemaType,
	otherData?: recordSchemaOtherData
): RecordSchema => {
	if (!value) {
		throw new Error('Value is required');
	}
	
	if (isNotRecordSchemaButObject(value)) {
		if (arrayItemSchema) {
			if (SchemaChoicer.isPrototypeOf(arrayItemSchema)) {
				const choosedSchema: SchemaChoice | null = (arrayItemSchema as typeof SchemaChoicer).getSchema(value);
				
				if (choosedSchema) {
					return new choosedSchema.schema(value, {
						...otherData,
						schemaChooser: arrayItemSchema,
						choosedSchema: choosedSchema,
					});
				}
			} else {
				return new (arrayItemSchema as ClassType<RecordSchema>)(value, otherData) as RecordSchema;
			}
		}
		
		return castToRecordSchema(value);
	}
	return value
}

export const castByArrayItemSchemaInField = (el: any[], index: number, field: Field): RecordSchema => {
	const value = el[index]
	if (!value) {
		throw new Error()
	}

	if (isNotRecordSchemaButObject(value)) {
		if (field.arrayItemSchema) {
			if (SchemaChoicer.isPrototypeOf(field.arrayItemSchema)) {
				const choosedSchema: SchemaChoice | null = (field.arrayItemSchema as typeof SchemaChoicer).getSchema(value);
				if (choosedSchema) {
					return new choosedSchema.schema(value, {
						schemaChooser: field.arrayItemSchema,
						choosedSchema: choosedSchema,
					});
				}
			} else		
				return (new field.arrayItemSchema(value)) as RecordSchema;
		}
			
		return castToRecordSchema(value);
	}

	return value
}

export const castByNestedSchemaInField = (el: any, field: Field): RecordSchema => (
	isNotRecordSchemaButObject(el) && field.nestedSchema
	? new field.nestedSchema(el)
	: castToRecordSchema(el)
)

export type recordSchemaOtherData = {
	schemaChooser?: ClassType<SchemaChoicer> | null,
	choosedSchema?: SchemaChoice | null,
}

export class RecordSchema {
	static fields: Field[] = [];

	getFieldByKey(key: string) {
		const fields = (this.constructor as typeof RecordSchema).fields || [];
		return fields.find((el: Field) => el.key === key)
	} 

	schemaChooser: recordSchemaOtherData['schemaChooser'] = null;
	choosedSchema: recordSchemaOtherData['choosedSchema'] = null;

	extraFields: Field[];

	data: SchemaData = {};

	constructor(data: SchemaData = {}, otherData?: recordSchemaOtherData) {
		this.extraFields = new Array();
		
		// Проверка на корректный тип данных
		if (!data || typeof data !== "object" || Array.isArray(data)) {
			console.error("wrong data type in RecordSchema", data);
			this.data = {};
			return;
		}

		this.data = data;

		if (otherData) {
			if (otherData.schemaChooser) {
				this.schemaChooser = otherData.schemaChooser
			}
			if (otherData.choosedSchema) {
				this.choosedSchema = otherData.choosedSchema
			}
		}
		
		const fields = (this.constructor as typeof RecordSchema).fields || [];
		const lazyLoadFunctions: Map<string, (data: SchemaData) => string> = new Map()
		
		const usedKeys: Set<string> = new Set();

		for (const field of fields) {
			usedKeys.add(field.key)

			if (field.key in this.data)
				continue;
	
			const defVal = field.getDefaultValue ? field.getDefaultValue(data) : field.defaultValue;
			if (typeof defVal === "function") {
				lazyLoadFunctions.set(field.key, defVal)
			} else if (defVal !== undefined) {
				this.data[field.key] = defVal ?? null
			} else if (field.type === "object" && field.nestedSchema) {
				this.data[field.key] = new field.nestedSchema()
			}
		}

		for (const [key, value] of Object.entries(this.data)) {
			if (!usedKeys.has(key)) {
				this.extraFields.push(Field.create({
					key: key,
					label: this.formatKey(key),
					type: autoDetectType(value),
					placeholder: "",
					description: "",
				}))
			}
		}

		for (const [key, func] of lazyLoadFunctions.entries()) {
			this.data[key] = func(this.data) ?? null;
		}
	}

	castToNewSchema(
		newSchema: ClassType<RecordSchema>
		, otherData?: recordSchemaOtherData
	): RecordSchema {
		if (otherData?.choosedSchema?.onSchemaChange)
			otherData.choosedSchema.onSchemaChange(this);
		const newInstance = new newSchema(
			this.data
			, otherData
		);
		if (otherData?.choosedSchema?.onSchemaPostChange)
			otherData.choosedSchema.onSchemaPostChange(newInstance);
		return newInstance;
	}

	sanitize() {
		const fields = (this.constructor as typeof RecordSchema).fields || [];
		const fieldsMap = new Map(fields.map(f => [f.key, f]));
		
		const keysToDelete: string[] = [];
		
		for (const key of Object.keys(this.data)) {
			if (idsFields.includes(key.toLowerCase())) continue;

			const field = fieldsMap.get(key)
			if (!field) {
				keysToDelete.push(key)
				continue
			}

			if (field.type === "object") {
				continue
			}

			const defVal = field.getDefaultValue
			? field.getDefaultValue(this.data)
			: field.defaultValue;
			
			if (defVal !== undefined) {
				this.data[key] = defVal
				continue
			}
			
			keysToDelete.push(key)
		}
		
		for (const key of keysToDelete) {
			delete this.data[key];
		}
		// Обновляем extraFields
		this.extraFields = [];
	}

	/** Получить поля текущего класса */
	getFields(): Field[] {
		return [...(this.constructor as typeof RecordSchema).fields, ...this.extraFields];
	}

	/** Получить данные */
	getData(): SchemaData {
		return this.data;
	}

	getId(): string | undefined {
		return (
			this.data["_id"] 
			?? this.data["_id"]
		)
	}

	/** Получить значение поля */
	get(key: string): any {
		return this.data[key];
	}

	/** Установить значение поля */
	set(key: string, value: any): void {
		const field = this.getField(key);
		
		// Если поле array и есть arrayItemSchema, преобразуем элементы
		if (field?.type === 'array' && field.arrayItemSchema && Array.isArray(value)) {
			this.data[key] = value.map(item => 
				item instanceof RecordSchema ? item : new field.arrayItemSchema!(item)
			);
		}
		// Если поле object и есть nestedSchema, преобразуем
		else if (field?.type === 'object' && field.nestedSchema && value && typeof value === 'object') {
			this.data[key] = value instanceof RecordSchema ? value : new field.nestedSchema(value);
		}
		else {
			this.data[key] = value;
		}
	}

	/** Получить все ключи данных */
	getKeys = (): string[] => Object.keys(this.data)

	/** Проверить, есть ли поле в данных */
	has(key: string): boolean {
		return key in this.data;
	}

	/** Получить видимые поля */
	getVisibleFields(): Field[] {
		const fields = this.getFields().filter(field => field.type !== 'hidden');
		return fields
			.filter(f => f.visible !== false)
			.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
	}

	getDisplayFields = (): Array<Field> => this.getVisibleFields()

	/** Найти поле по ключу */
	getField(key: string): Field | undefined {
		const fields = this.getFields();
		return fields.find(f => f.key === key);
	}

	/** Получить поля для отображения */
	

	/** Определить тип поля */
	resolveType(key: string): FieldType {
		const field = this.getField(key);
		if (field) return field.type;

		const rawValue = this.data[key];
		if (rawValue === null || rawValue === undefined) return 'text';
		if (Array.isArray(rawValue)) return 'array';
		if (typeof rawValue === 'boolean') return 'boolean';
		if (typeof rawValue === 'number') return 'number';
		if (typeof rawValue === 'object') return 'object';
		return 'text';
	}

	/** Можно ли провалиться вглубь */
	isNavigable(key: string): boolean {
		const field = this.getField(key);
		const rawValue = this.data[key];
		
		if (field) {
			return field.type === 'object' || field.type === 'array' || !!field.nestedSchema || !!field.arrayItemSchema;
		}
		return (
			rawValue !== null &&
			typeof rawValue === 'object'
		);
	}

	/** Получить label */
	getLabel(key: string): string {
		return this.getField(key)?.label ?? this.formatKey(key);
	}

	/** Получить placeholder */
	getPlaceholder(key: string): string {
		return this.getField(key)?.placeholder ?? "";
	}

	/** Получить options */
	getOptions(key: string): any[] | undefined {
		return this.getField(key)?.options;
	}

	/** Редактируемо ли поле */
	isEditable(key: string): boolean {
		const field = this.getField(key);
		if (!field) return true;
		return field.editable !== false;
	}

	/** Получить описание */
	getDescription(key: string): string {
		return this.getField(key)?.description ?? "";
	}

	/** Валидация поля */
	validateField(key: string, value: any): true | string {
		const field = this.getField(key);
		if (!field || !field.validate) return true;
		return field.validate(value, this.data);
	}

	/** Валидация всех полей */
	validate(): { valid: boolean; errors: Record<string, string> } {
		const errors: Record<string, string> = {};
		const fields = this.getFields();
		
		for (const field of fields) {
			const value = this.data[field.key];
			const result = this.validateField(field.key, value);
			if (result !== true) {
				errors[field.key] = result;
			}
		}
		
		return {
			valid: Object.keys(errors).length === 0,
			errors
		};
	}

	/** Обновить данные */
	update(data: Partial<SchemaData>): this {
		const instance = new (this.constructor as any)({ ...this.data, ...data });
		return instance;
	}

	/** Сериализация */
	toJSON(): SchemaData {
		const result: SchemaData = {};
		for (const [key, value] of Object.entries(this.data)) {
			if (value instanceof RecordSchema) {
				result[key] = value.toJSON();
			} else if (Array.isArray(value) && value.some(v => v instanceof RecordSchema)) {
				result[key] = value.map(v => v instanceof RecordSchema ? v.toJSON() : v);
			} else {
				result[key] = value;
			}
		}
		return result;
	}

	formatKey(key: string): string {
		return key
			.replace(/([A-Z])/g, " $1")
			.replace(/_/g, " ")
			.replace(/^./, str => str.toUpperCase());
	}
}