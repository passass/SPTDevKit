<template>
    <div class="localization-input">
        <div class="input-group">
            <!-- Поле ввода для ключа -->
            <input
                type="text"
                :value="localizedId"
                @input="handleIdChange"
                placeholder="Введите ключ локализации"
                :disabled="!field.editable || field.virtual"
                class="localization-input__field localization-input__field--key"
            />
            <!-- Combobox для выбора языка -->
            <select v-model="selectedLocale" class="localization-input__select">
                <option v-for="lang in availableLocales" :key="lang" :value="lang">
                    {{ lang.toUpperCase() }}
                </option>
            </select>
        </div>

        <!-- Textarea для отображения переведенного текста -->
        <textarea
            v-model="localizedText"
            placeholder="Переведенный текст"
            class="localization-input__textarea"
            rows="2"
        ></textarea>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { gameLocalization, availableLocales, type locales, type localizationTextParams } from "@/types/localization";
import type { Field, SchemaData } from "@/types/fields/fields";

const props = defineProps<{
    modelValue?: string;
    data: SchemaData;
    field: Field;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const selectedLocale = ref<locales>(gameLocalization.currentLocale.value);

// Вычисляем отображаемый ключ локализации
const localizedId = computed(() => {
    if (props.field.virtual) {
        return props.field.getDefaultValue ? props.field.getDefaultValue(props.data) : props.modelValue;
    }
    return props.modelValue;
});

// Параметры для получения текста локализации
const params = computed<localizationTextParams>(() => ({
    localeId: localizedId.value,
    notCheckForDefaultLocalization: true,
}));

// Текст локализации для отображения
const localizedText = computed({
    get: () => {
        return gameLocalization.getText({
            ...params.value,
            locale: selectedLocale.value,
        });
    },
    set: (val: string) => {
        gameLocalization.updateLocaleText(
            {
                ...params.value,
                locale: selectedLocale.value,
            },
            val
        );
    },
});

// Обработчик изменения ключа (только если не виртуальное)
function handleIdChange(event: Event) {
    if (props.field.virtual) return;
    const value = (event.target as HTMLInputElement).value;
    emit("update:modelValue", value);
}
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
