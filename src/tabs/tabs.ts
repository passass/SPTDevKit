// src/tabs/tabs.ts
import type { RecordSchema } from '@/types/fields/fields';
import type { ClassType } from '@/utils/classUtils';
import type { Component } from 'vue'

export type TabData = object;
export type Tabs = Tab[];

// ===== Вкладка =====
export interface Tab {
  id: string
  label: string
  icon?: string
  badge?: number | null

  title?: string
  component?: Component
  props?: Record<string, any>
  footer?: string
  schemaType?: ClassType<RecordSchema>

  dataTitle?: string
  data?: TabData
}

// ===== Экспорт по умолчанию для совместимости =====
export default {}