<template>
  <div class="localization-input">
    <div class="input-group">
      <!-- Поле ввода для ключа -->
      <input
        type="text"
        :value="localizationId"
        @input="handleIdChange"
        placeholder="Введите ключ локализации"
        class="localization-input__field localization-input__field--key"
      />

      <!-- Combobox для выбора языка -->
      <select
        :value="currentLocale"
        @change="handleLocaleChange"
        class="localization-input__select"
      >
        <option
          v-for="lang in availableLocales"
          :key="lang"
          :value="lang"
        >
          {{ lang.toUpperCase() }}
        </option>
      </select>
    </div>

    <!-- Textarea для отображения переведенного текста -->
    <textarea
      :value="localizedText"
      readonly
      placeholder="Переведенный текст"
      class="localization-input__textarea"
      rows="2"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue';
import { gameLocalization, availableLocales, type locales, choiceStrings, stringOrEmptyString } from '@/types/localization';

// Props
const props = defineProps({
  localizationId: {
    type: String,
    default: '',
  },
});

const currentLocale: locales = inject<Ref<string>>('currentLocale', ref('ru')).value as locales;
const emit = defineEmits(['update:localizationId', 'update:locale']);

// Обработчик изменения ID
const handleIdChange = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  emit('update:localizationId', value);
};

// Обработчик изменения локали
const handleLocaleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:locale', value);
};

// Получение текста локализации
const localizedText = computed(() => {
  if (typeof props.localizationId !== 'string') return '';
  
  try {
    const text = gameLocalization.getText(props.localizationId, currentLocale);
    return choiceStrings(text, props.localizationId);
  } catch (error) {
    console.error('Ошибка получения локализации:', error);
    return props.localizationId;
  }
});
</script>

<style scoped>
.localization-input {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.localization-input__field {
  flex: 2;
  min-width: 150px;
  padding: 6px 10px;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  font-size: 12px;
  transition: border-color 0.15s ease;
  background: #333333;
  color: #e0e0e0;
}

.localization-input__field:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.localization-input__field::placeholder {
  color: #777;
  font-size: 11px;
}

.localization-input__field--key {
  flex: 2;
}

.localization-input__select {
  flex: 0.5;
  min-width: 70px;
  padding: 6px 10px;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  font-size: 12px;
  background: #333333;
  color: #e0e0e0;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.localization-input__select:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.localization-input__textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  font-size: 12px;
  background: #2a2a2a;
  color: #b0b0b0;
  resize: vertical;
  min-height: 36px;
  font-family: inherit;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.localization-input__textarea:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.localization-input__textarea::placeholder {
  color: #666;
  font-size: 11px;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 640px) {
  .input-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .localization-input__field,
  .localization-input__select,
  .localization-input__textarea {
    width: 100%;
    min-width: unset;
  }
}
</style>