// src/tabs/tabs.ts
import type { Component } from 'vue'

export type TabData = object;

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

  dataTitle?: string
  data?: TabData
}

// ===== Экспорт по умолчанию для совместимости =====
export default {}