// src/tabs/tabs.ts
import type { RecordSchema } from "@/types/fields/fields";
import type { ClassType } from "@/utils/classUtils";
import type { Component, ComputedRef } from "vue";

export type TabData = object;
export type Tabs = Tab[];
export type ComputedValue<T> = ComputedRef<T> | T

// ===== Вкладка =====
export interface Tab {
	id: string;
	label: string;
	icon?: string;
	badge?: ComputedValue<number>;

	title?: string;
	component?: Component;
	props?: Record<string, any>;
	footer?: string;

	schemaType?: ClassType<RecordSchema>;
	dataStoreId?: string;

	dataTitle?: string;
	data?: TabData;
}

// ===== Экспорт по умолчанию для совместимости =====
export default {};
