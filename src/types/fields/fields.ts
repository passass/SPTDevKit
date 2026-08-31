// src/types/fields.ts
import { Data } from "dataclass";
import { type SchemaChoice, SchemaChoicer } from "./fieldsSchemaChoicer";
import { getStaticField, type ClassType } from "@/utils/classUtils";

export const idsFields: string[] = ['_id', 'id']
export function getIdFieldValue(instance: any): string | undefined {
	for (const idField of idsFields) {
		if (typeof instance[idField] === "string") {
			return instance[idField]
		}
	}
}

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
	| 'optionsArray'
	| 'stringArray'
	| 'numberArray'
	| 'hidden'
	| 'localization'
	| "advancedSelect"
	| 'arrayAdvancedSelect';

export class Field extends Data {
	key: string = "";
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
	virtual?: boolean;

	initialValue?: (data: SchemaData) => any;
	onChange?: (data: SchemaData, event: Event) => void;

	hidden?: boolean;
	unneccesary?: boolean;

	getDefaultValue?(data: SchemaData): any;
	exactValue?(data: SchemaData): any;

	isArray(): boolean {return this.type.toLocaleLowerCase().includes("array")};
}

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
				const choosedSchema: SchemaChoice = (
					(arrayItemSchema as typeof SchemaChoicer).getSchema(value)
					?? (arrayItemSchema as typeof SchemaChoicer).schemas[0]
				);

				return new choosedSchema.schema(value, {
					...otherData,
					schemaChooser: arrayItemSchema,
					choosedSchema: choosedSchema,
				});
			} else {
				return new (arrayItemSchema as ClassType<RecordSchema>)(value, otherData) as RecordSchema;
			}
		}

		return castToRecordSchema(value, undefined, otherData);
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

function resolveDefaultValue(field: Field, data: SchemaData): any {
    let val = field.getDefaultValue ? field.getDefaultValue(data) : field.defaultValue;

    if (val === undefined) {
        if (field.type === 'object' && field.nestedSchema) {
            return new field.nestedSchema();
        }
		if (field.type === 'text')
			return '';
		if (field.type === 'number')
			return 0;
		if (field.type === 'boolean')
			return false;
		if (field.type === 'select' && field.options)
			return field.options[0];
        if (['array', 'stringArray', 'numberArray', 'arrayAdvancedSelect'].includes(field.type)) {
            return [];
        }
        return null;
    }

    // Глубокое клонирование объектов и массивов, чтобы избежать共享 ссылок между экземплярами
    if (val !== null && typeof val === 'object') {
        try {
            return structuredClone(val);
        } catch {
            return JSON.parse(JSON.stringify(val));
        }
    }

    return val;
}

export class LocalizationField extends Field {
	type: FieldType = 'localization';

	getDefaultValue(data: SchemaData): string {
		const key = this.key;
		return `${data["_id"]} ${key}`;
	}
}

export class VirtualLocalizationField extends LocalizationField {
	type: FieldType = 'localization';
	virtual: boolean = true;
	editable: boolean = false;

	getDefaultValue(data: SchemaData): string {
		return data["id"] ?? data["_id"];
	}
}

export type recordSchemaOtherData = {
	schemaChooser?: ClassType<SchemaChoicer> | null,
	choosedSchema?: SchemaChoice | null,
	parent?: Record<string, any> | Array<object> | RecordSchema | null,
}

export class RecordSchema {
	static fields: Field[] = [];

	static getFieldByKeyStatic(key: string, def?: any) {
		const fields = this.fields || [];
		return fields.find((el: Field) => el.key === key) ?? def
	}
	getFieldByKey(key: string, def?: any) {
		const fields = (this.constructor as typeof RecordSchema).fields || [];
		return fields.find((el: Field) => el.key === key) ?? def
	}

	getLocalizationFieldsKeys(): string[] {
		const res = new Set<string>();

		const processSchema = (instance: RecordSchema) => {
			const fields = instance.getFields();
			for (const field of fields) {
				if (field instanceof LocalizationField && field.key) {
					const value = instance.get(field.key);
					if (value) res.add(value);
				} else if (field instanceof VirtualLocalizationField) {
					res.add(field.getDefaultValue(instance.data))
				} else if (field.nestedSchema) {
					const nestedData = instance.get(field.key);
					if (nestedData && typeof nestedData === 'object') {
						const nestedInstance = castToRecordSchema(nestedData, field.nestedSchema);
						processSchema(nestedInstance);
					}
				} else if (field.arrayItemSchema) {
					const arrayData = instance.get(field.key);
					if (Array.isArray(arrayData)) {
						for (const item of arrayData) {
							if (item && typeof item === 'object') {
								if (SchemaChoicer.isPrototypeOf(field.arrayItemSchema)) {
									const choicer = field.arrayItemSchema as unknown as typeof SchemaChoicer;
									for (const schemaChoice of choicer.schemas) {
										const nestedInstance = castToRecordSchema(item, schemaChoice.schema);
										processSchema(nestedInstance);
									}
								} else {
									const nestedInstance = castToRecordSchema(item, field.arrayItemSchema as ClassType<RecordSchema>);
									processSchema(nestedInstance);
								}
							}
						}
					}
				}
			}
		};

		processSchema(this);
		return Array.from(res);
	}
	schemaChooser: recordSchemaOtherData['schemaChooser'] = null;
	choosedSchema: recordSchemaOtherData['choosedSchema'] = null;
	parent: recordSchemaOtherData['parent'] = null;

	storeId?: string;

	extraFields: Field[];

	data: SchemaData = {};

	constructor(data: SchemaData = {}, otherData?: recordSchemaOtherData) {
        this.extraFields = [];

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            console.error("wrong data type in RecordSchema", data);
            this.data = {};
            return;
        }

        this.data = data;

        if (otherData) {
            if (otherData.schemaChooser) this.schemaChooser = otherData.schemaChooser;
            if (otherData.choosedSchema) this.choosedSchema = otherData.choosedSchema;
            if (otherData.parent) this.parent = otherData.parent;
        }

        const fields = (this.constructor as typeof RecordSchema).fields || [];
        const lazyLoadFunctions = new Map<string, (data: SchemaData) => any>();
        const usedKeys = new Set<string>();

		for (const field of fields) {
			if (!field.key) continue;
            usedKeys.add(field.key);
            if (field.key in this.data) continue;

            const defVal = resolveDefaultValue(field, data);

            if (typeof defVal === "function") {
                lazyLoadFunctions.set(field.key, defVal);
            } else {
                this.data[field.key] = defVal;
            }
        }

        for (const [key, value] of Object.entries(this.data)) {
            if (!usedKeys.has(key)) {
                this.extraFields.push(Field.create({
                    key,
                    label: this.formatKey(key),
                    type: autoDetectType(value),
                    placeholder: "",
                    description: "",
                }));
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

			const defVal = resolveDefaultValue(field, this.data);

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
		return [...(getStaticField(this, "fields") as any), ...this.extraFields];
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
			if (!field.key) continue;
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
