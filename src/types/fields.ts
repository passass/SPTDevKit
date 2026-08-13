// src/types/fields.ts
import { Data } from "dataclass";

export type FieldType = 'text' | 'number' | 'boolean' | 'textarea' | 'select' | 'object' | 'array' | 'hidden';
export type SchemaConstructor<T extends RecordSchema = RecordSchema> = new (data?: any) => T;

/** Описание одного поля записи */
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
	validate?: (value: any, record: Record<string, any>) => true | string;
	nestedSchema?: RecordSchema;
}

/** Базовый класс схемы записи */
export class RecordSchema {
	/** Статическое поле с описанием полей схемы */
	static fields: Field[] = [];

	/** Данные записи */
	private _data: Record<string, any> = {};

	/** Конструктор принимает только данные */
	constructor(data: Record<string, any> = {}) {
		this._data = data;
		
		// Применяем значения по умолчанию из статических полей
		const fields = (this.constructor as typeof RecordSchema).fields || [];
		for (const field of fields) {
			if (field.defaultValue !== undefined && !(field.key in this._data)) {
				this._data[field.key] = field.defaultValue ?? null;
			}
		}
	}

	/** Получить поля текущего класса */
	getFields(): Field[] {
		return (this.constructor as typeof RecordSchema).fields || [];
	}

	/** Получить данные */
	get data(): Record<string, any> {
		return this._data;
	}

	/** Получить значение поля */
	get(key: string): any {
		return this._data[key];
	}

	/** Установить значение поля */
	set(key: string, value: any): void {
		this._data[key] = value;
	}

	/** Получить все ключи данных */
	getKeys(): string[] {
		return Object.keys(this._data);
	}

	/** Проверить, есть ли поле в данных */
	has(key: string): boolean {
		return key in this._data;
	}

	/** Получить видимые поля */
	getVisibleFields(): Field[] {
		const fields = this.getFields();
		return fields
			.filter(f => f.visible !== false)
			.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
	}

	/** Найти поле по ключу */
	getField(key: string): Field | undefined {
		const fields = this.getFields();
		return fields.find(f => f.key === key);
	}

	/** Получить поля для отображения */
	getDisplayFields(): Array<{ key: string; field?: Field; value: any }> {
		const result: Array<{ key: string; field?: Field; value: any }> = [];
		const usedKeys = new Set<string>();
		const fields = this.getFields();

		// 1. Поля из схемы
		for (const field of this.getVisibleFields()) {
			if (field.key in this._data) {
				result.push({ key: field.key, field, value: this._data[field.key] });
				usedKeys.add(field.key);
			}
		}

		// 2. Оставшиеся ключи из data
		for (const key of Object.keys(this._data)) {
			if (!usedKeys.has(key)) {
				result.push({ key, value: this._data[key] });
			}
		}

		return result;
	}

	/** Определить тип поля */
	resolveType(key: string): FieldType {
		const field = this.getField(key);
		if (field) return field.type;

		const rawValue = this._data[key];
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
		const rawValue = this._data[key];
		
		if (field) {
			return field.type === 'object' || !!field.nestedSchema;
		}
		return (
			rawValue !== null &&
			typeof rawValue === 'object' &&
			!Array.isArray(rawValue)
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
		return field.validate(value, this._data);
	}

	/** Валидация всех полей */
	validate(): { valid: boolean; errors: Record<string, string> } {
		const errors: Record<string, string> = {};
		const fields = this.getFields();
		
		for (const field of fields) {
			const value = this._data[field.key];
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
	update(data: Partial<Record<string, any>>): this {
		const instance = new (this.constructor as any)({ ...this._data, ...data });
		return instance;
	}

	/** Сериализация */
	toJSON(): Record<string, any> {
		return { ...this._data };
	}

	private formatKey(key: string): string {
		return key
			.replace(/([A-Z])/g, " $1")
			.replace(/_/g, " ")
			.replace(/^./, str => str.toUpperCase());
	}
}