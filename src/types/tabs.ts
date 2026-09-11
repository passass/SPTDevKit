// src/tabs/tabs.ts
import type { RecordSchema } from "@/types/fields/fields";
import type { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";
import type { Component, ComputedRef } from "vue";

export type TabData = object;
export type Tabs = Tab[];
export type ComputedValue<T> = ComputedRef<T> | T

// ===== Вкладка =====
export interface Tab {
	id: string;
	label: string;
	icon?: string;
    badge?: number; //| number;

	title?: string;
	component?: Component;
	props?: Record<string, any>;
	footer?: string;

	schemaType?: typeof RecordSchema | typeof SchemaChoicer;
	dataStoreId?: string;

	dataTitle?: string;
	data?: TabData;
}

// ===== Экспорт по умолчанию для совместимости =====
export default {};
