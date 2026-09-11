import { Data } from "dataclass";
import { type SchemaChoice, SchemaChoicer } from "./fieldsSchemaChoicer";
import { getStaticField } from "@/utils/classUtils";
import { getValueByPath } from "@/utils/utils";
import { type FieldContext } from "./fieldsConsts";

export const idsFields: string[] = ["_id", "id"];
export function getIdFieldValue(instance: any): string | undefined {
    for (const idField of idsFields) {
        if (typeof instance[idField] === "string") {
            return instance[idField];
        }
    }
}

export type arrayItemSchemaType = typeof RecordSchema | typeof SchemaChoicer | null;
// export type SchemaData = Record<string, any>;
export interface SchemaDataObject {
    [key: string]: SchemaValue;
}

export type SchemaValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | SchemaValue[]
    | SchemaDataObject;

export type SchemaData = SchemaDataObject;
export type FieldType =
    | "text"
    | "number"
    | "boolean"
    | "textarea"
    | "select"
    | "object"
    | "array"
    | "optionsArray"
    | "stringArray"
    | "numberArray"
    | "hidden"
    | "localization"
    | "advancedSelect"
    | "arrayAdvancedSelect"
    | "arrayArrayAdvancedSelect";

export class Field extends Data {
    key: string = "";
    label!: string;
    description?: string = "";
    placeholder?: string = "";
    type!: FieldType;
    visible?: boolean = true;
    editable?: boolean = true;
    order?: number = 1;
    options?: string[] | Record<any, string>;
    defaultValue?: any;
    validate?: (value: any, record: SchemaData) => true | string;
    nestedSchema?: typeof RecordSchema;
    arrayItemSchema?: arrayItemSchemaType;
    virtual?: boolean;
    extraKeys?: string[];

    initialValue?: (data: SchemaData) => any;
    onChange?: (data: SchemaData, event: Event) => void;
    onIfInData?: (data: SchemaData) => void;

    hidden?: boolean;
	unneccesary?: boolean;

	excludeFromToJSON?: boolean;
	alwaysFillWithDefault?: boolean;

	onNestedSchemaCopy?(fieldContext: FieldContext, oldSchema: RecordSchema): void;

    onArrayItemDelete?(fieldContext: FieldContext, index: number): void;
    onArrayItemAdd?(fieldContext: FieldContext, newVal: any): void;
    onArrayNavigate?(fieldContext: FieldContext, index: number): void;

    onUpdateModelValue?(recordSchema: RecordSchema, newVal: any): void;

    getSerializedValue?(fieldContext: FieldContext): any;
	getDefaultValue?(data: SchemaData): any;

    isArray(): boolean {
        return this.type && this.type.toLocaleLowerCase().includes("array");
    }
}

export class AdvSelectField extends Field {
    type: FieldType = "arrayAdvancedSelect";

    storeId!: string;
}

function autoDetectType(value: any): FieldType {
    if (value === null || value === undefined) return "text";
    if (Array.isArray(value)) return "array";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string" && value.length > 100) return "textarea";
    if (typeof value === "object" || value instanceof RecordSchema) return "object";
    return "text";
}

export const isObjectNotArray = (item: any): boolean => typeof item === "object" && !Array.isArray(item);
export const isNotRecordSchemaButObject = (el: any): boolean =>
    typeof el === "object" && !(el instanceof RecordSchema) && !Array.isArray(el);

export const castToRecordSchema = (
    value: any,
    schema?: arrayItemSchemaType,
    otherData?: recordSchemaOtherData
): RecordSchema => {
    if (value !== null && value !== undefined && isNotRecordSchemaButObject(value)) {
        if (schema) {
            if (SchemaChoicer.isPrototypeOf(schema)) {
                const choosedSchema: SchemaChoice =
                    (schema as typeof SchemaChoicer).getSchema(value) ?? (schema as typeof SchemaChoicer).schemas[0];

                return new choosedSchema.schema(value, {
                    ...otherData,
                    schemaChooser: schema as typeof SchemaChoicer,
                    choosedSchema: choosedSchema,
                });
            }

            return new (schema as typeof RecordSchema)(value, otherData) as RecordSchema;
        }

        return new RecordSchema(value, otherData);
    }
    return value;
};

export function resolveDefaultValue(field: Field, data: SchemaData): any {
    let val = field.getDefaultValue ? field.getDefaultValue(data) : field.defaultValue;

    if (val === undefined) {
        if (field.type === "object" && field.nestedSchema) {
            return new field.nestedSchema();
        }
        if (field.type === "text") return "";
        if (field.type === "number") return 0;
        if (field.type === "boolean") return false;
        if (field.type === "select" && field.options)
            return Array.isArray(field.options) ? field.options[0] : Object.values(field.options)[0];
        if (field.isArray()) {
            return [];
        }
        return null;
    }

    return val;
}

export class LocalizationField extends Field {
    type: FieldType = "localization";

    getDefaultValue(data: SchemaData): string {
        const key = this.key;
		const id = data["id"] ?? data["_id"];
        if (typeof id !== "string") return "";
        if (key) return `${id} ${key}`;
        return id;
    }
}

export class VirtualLocalizationField extends LocalizationField {
    type: FieldType = "localization";
    virtual: boolean = true;
    editable: boolean = false;
}

export type recordSchemaOtherData = {
    schemaChooser?: typeof SchemaChoicer | null;
    choosedSchema?: SchemaChoice | null;
    parent?: Record<string, any> | Array<object> | RecordSchema | null;
    name?: string | null;
    fillWithDefault?: boolean;
};

export class RecordSchema {
    static fields: Field[] = [];

    static getFieldByKeyStatic(key: string, def?: any) {
        const fields = this.fields || [];
        return fields.find((el: Field) => el.key === key) ?? def;
	}

	static replaceFieldWith(field: Field) {
		const fields = this.fields || [];
		const index = fields.findIndex((el: Field) => el.key === field.key);
		if (index !== -1) {
			fields[index] = field;
		}
	}

	static from(value: any, otherData?: recordSchemaOtherData) {
		return castToRecordSchema(value, this, otherData);
    }

    getFieldByKey(key: string, def?: any) {
        const fields = (this.constructor as typeof RecordSchema).fields || [];
        return fields.find((el: Field) => el.key === key) ?? def;
	}

	getValueByPath(path: string): any {
		return getValueByPath(this.getData(), path)
	}

	getArrayCastedData(key: string): RecordSchema[] {
        const field = this.getFieldByKey(key);
        if (!field) return [];
        if (!field.arrayItemSchema) return [];
        const nestedData = this.get(key);
        if (!nestedData) return [];
        if (!Array.isArray(nestedData)) return [];
        return nestedData.map((item: any) => castToRecordSchema(item, field.arrayItemSchema));
    }

    getCastedData(key: string): RecordSchema | undefined {
        const field = this.getFieldByKey(key);
        if (!field) return;
        if (!field.nestedSchema) return;
        const nestedData = this.get(key);
        if (!nestedData)
            return castToRecordSchema({}, field.nestedSchema, {
                fillWithDefault: true,
            });
        return castToRecordSchema(nestedData, field.nestedSchema);
    }

    getLocalizationFieldsKeys(): string[] {
        const res = new Set<string>();

        const processSchema = (instance: RecordSchema) => {
            const fields = instance.getFields();
            for (const field of fields) {
                if (field instanceof LocalizationField && field.key) {
                    const value = instance.get(field.key);
					if (typeof value === "string")
						res.add(value);
                } else if (field instanceof VirtualLocalizationField) {
                    res.add(field.getDefaultValue(instance.data));
                } else if (field.nestedSchema) {
                    const nestedData = instance.get(field.key);
                    if (nestedData && typeof nestedData === "object") {
                        const nestedInstance = castToRecordSchema(nestedData, field.nestedSchema);
                        processSchema(nestedInstance);
                    }
                } else if (field.arrayItemSchema) {
                    const arrayData = instance.get(field.key);
                    if (Array.isArray(arrayData)) {
                        for (const item of arrayData) {
                            if (item && typeof item === "object") {
                                if (SchemaChoicer.isPrototypeOf(field.arrayItemSchema)) {
                                    const choicer = field.arrayItemSchema as unknown as typeof SchemaChoicer;
                                    for (const schemaChoice of choicer.schemas) {
                                        const nestedInstance = castToRecordSchema(item, schemaChoice.schema);
                                        processSchema(nestedInstance);
                                    }
                                } else {
                                    const nestedInstance = castToRecordSchema(
                                        item,
                                        field.arrayItemSchema as typeof RecordSchema
                                    );
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
    schemaChooser: recordSchemaOtherData["schemaChooser"] = null;
    choosedSchema: recordSchemaOtherData["choosedSchema"] = null;
    parent: recordSchemaOtherData["parent"] = null;
    name: recordSchemaOtherData["name"] = null;

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
            if (otherData.name) this.name = otherData.name;
        }

        const fields = (this.constructor as typeof RecordSchema).fields || [];
        const lazyLoadFunctions = new Map<string, (data: SchemaData) => any>();
        const usedKeys = new Set<string>();

        for (const field of fields) {
            if (!field.key) continue;
            usedKeys.add(field.key);
            if (field.key in this.data) {
                if (field.onIfInData) field.onIfInData(this.data);
                continue;
            }

            if (field.extraKeys) {
                for (const extraKey of field.extraKeys) {
                    usedKeys.add(extraKey);
                    if (extraKey in this.data) {
                        this.data[field.key] = this.data[extraKey];
                        delete this.data[extraKey];
                        continue;
                    }
                }
                if (field.key in this.data) continue;
            }

            if (otherData?.fillWithDefault || field.alwaysFillWithDefault) {
                let defVal;
                if (field.type === "object" && field.nestedSchema) {
                    defVal = new field.nestedSchema(
                        {},
                        {
                            fillWithDefault: true,
                        }
                    ).toJSON();
                } else {
                    defVal = resolveDefaultValue(field, data);
                }

                if (typeof defVal === "function") {
                    lazyLoadFunctions.set(field.key, defVal);
                } else {
                    this.data[field.key] = defVal;
                }
            }
        }

        for (const [key, value] of Object.entries(this.data)) {
            if (!usedKeys.has(key)) {
                this.extraFields.push(
                    Field.create({
                        key,
                        label: this.formatKey(key),
                        type: autoDetectType(value),
                        placeholder: "",
                        description: "",
                    })
                );
            }
        }

        for (const [key, func] of lazyLoadFunctions.entries()) {
            this.data[key] = func(this.data) ?? null;
        }
    }

    castToNewSchema(newSchema: typeof RecordSchema, otherData?: recordSchemaOtherData): RecordSchema {
        if (otherData?.choosedSchema?.onSchemaChange) otherData.choosedSchema.onSchemaChange(this);
        const newInstance = new newSchema(this.data, otherData);
        if (otherData?.choosedSchema?.onSchemaPostChange) otherData.choosedSchema.onSchemaPostChange(newInstance);
        return newInstance;
    }

    sanitize() {
        const fields = (this.constructor as typeof RecordSchema).fields || [];
        const fieldsMap = new Map(fields.map((f) => [f.key, f]));

        const keysToDelete: string[] = [];

        for (const key of Object.keys(this.data)) {
            if (idsFields.includes(key.toLowerCase())) continue;

            const field = fieldsMap.get(key);
            if (!field) {
                keysToDelete.push(key);
                continue;
            }

            if (field.type === "object") {
                continue;
            }

            const defVal = resolveDefaultValue(field, this.data);

            if (defVal !== undefined) {
                this.data[key] = defVal;
                continue;
            }

            keysToDelete.push(key);
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
		const id = this.data["_id"] ?? this.data["id"]
		if (typeof id !== "string") return undefined;
		return id;
    }

    /** Получить значение поля */
    get(key: string | Field): SchemaValue {
        return this.data[key instanceof Field ? key.key : key];
    }

    /** Установить значение поля */
    set(key: string | Field, value: any): void {
        const fieldKey = key instanceof Field ? key.key : key;
        const field = key instanceof Field ? key : this.getField(fieldKey);

        this.data[fieldKey] = field?.type === "number" ? Number(value) : value;
    }

    /** Получить все ключи данных */
    getKeys = (): string[] => Object.keys(this.data);

    /** Проверить, есть ли поле в данных */
    has(key: string): boolean {
        return key in this.data;
    }

    /** Получить видимые поля */
    getVisibleFields(): Field[] {
        const fields = this.getFields().filter((field) => field.type !== "hidden");
        return fields.filter((f) => f.visible !== false).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }

    getDisplayFields = (): Array<Field> => this.getVisibleFields();

    /** Найти поле по ключу */
    getField(key: string): Field | undefined {
        const fields = this.getFields();
        return fields.find((f) => f.key === key);
    }

    resolveType(key: string): FieldType {
        const field = this.getField(key);
        if (field) return field.type;

        const rawValue = this.data[key];
        if (rawValue === null || rawValue === undefined) return "text";
        if (Array.isArray(rawValue)) return "array";
        if (typeof rawValue === "boolean") return "boolean";
        if (typeof rawValue === "number") return "number";
        if (typeof rawValue === "object") return "object";
        return "text";
    }

    /** Можно ли провалиться вглубь */
    isNavigable(key: string): boolean {
        const field = this.getField(key);
        const rawValue = this.data[key];

        if (field) {
            return field.type === "object" || field.type === "array" || !!field.nestedSchema || !!field.arrayItemSchema;
        }
        return rawValue !== null && typeof rawValue === "object";
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
    getOptions(key: string): Field["options"] {
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
            errors,
        };
    }

    /** Обновить данные */
    update(data: Partial<SchemaData>): this {
        const instance = new (this.constructor as any)({ ...this.data, ...data });
        return instance;
    }

    /** Сериализация */
    /** Сериализация */
    toJSON(): SchemaData {
        const serialize = (obj: any): any => {
            if (obj === null || obj === undefined) return obj;

            if (obj instanceof RecordSchema) {
                return obj.toJSON();
            }

            if (obj instanceof Map) {
                const result: Record<string, any> = {};
                for (const [key, value] of obj.entries()) {
                    result[key] = serialize(value);
                }
                return result;
            }

            if (Array.isArray(obj)) {
                return obj.map((v) => serialize(v));
            }

            if (typeof obj === "object") {
                const result: Record<string, any> = {};
                for (const [key, value] of Object.entries(obj)) {
                    result[key] = serialize(value);
                }
                return result;
            }

            return obj;
        };

        const data = this.getData();

        // Карта полей текущей схемы
        const fieldsMap = new Map<string, Field>();
        for (const field of this.getFields()) {
            if (field.key) fieldsMap.set(field.key, field);
        }

        // Сериализует значение с учётом схемы поля
        const serializeFieldValue = (field: Field | undefined, value: any): any => {
            if (value === null || value === undefined) return value;

            // nestedSchema — кастим объект под схему и вызываем toJSON()
            if (field?.nestedSchema) {
                if (value instanceof RecordSchema) {
                    return value.toJSON();
                }
                if (typeof value === "object" && !Array.isArray(value)) {
                    const casted = field.nestedSchema.from(value);
                    if (casted instanceof RecordSchema) {
                        return casted.toJSON();
                    }
                    return casted;
                }
            }

            // arrayItemSchema — кастим каждый элемент массива под схему и вызываем toJSON()
            if (field?.arrayItemSchema && Array.isArray(value)) {
                return value.map((item: any) => {
                    if (item === null || item === undefined) return item;
                    if (item instanceof RecordSchema) return item.toJSON();
                    if (typeof item === "object") {
                        const casted = castToRecordSchema(item, field.arrayItemSchema!);
                        if (casted instanceof RecordSchema) {
                            return casted.toJSON();
                        }
                        return casted;
                    }
                    return item;
                });
            }

            return serialize(value);
        };

        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            const field = fieldsMap.get(key);
            if (field?.excludeFromToJSON) continue;

            if (field?.getSerializedValue) {
                result[key] = field.getSerializedValue({
                    field,
                    value,
                    recordSchema: this,
                    data,
                });
            } else {
                result[key] = serializeFieldValue(field, value);
            }
        }

        return result;
    }

    formatKey(key: string): string {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .replace(/^./, (str) => str.toUpperCase());
    }
}
