// src/components/inputs/ArrayInput.vue
<template>
    <div class="array-input">
        <div class="array-input__controls">
            <button
                type="button"
                class="array-input__nav-btn"
                @click="prevItem"
                :disabled="selectedIndex === null || selectedIndex <= 0"
                title="Предыдущий"
            >
                ◀
            </button>

            <span class="array-input__counter"> {{ displayIndex }} / {{ items.length }} </span>

            <button
                type="button"
                class="array-input__nav-btn"
                @click="nextItem"
                :disabled="selectedIndex === null || selectedIndex >= items.length - 1"
                title="Следующий"
            >
                ▶
            </button>

            <button type="button" class="array-input__btn" @click="addItem" title="Добавить элемент">+</button>

            <button class="array-input__btn" @click="deleteItem" title="Удалить элемент">-</button>
        </div>

        <!-- Режим optionsArray: select -->
        <div v-if="isOptionsArray" class="array-input__editor">
            <template v-if="selectedIndex !== null">
                <OptionsInput v-model="items[selectedIndex]" :field="field" :data="items" />
            </template>
        </div>

        <!-- Режим arrayAdvancedSelect: выбор из справочника -->
        <div v-else-if="isAdvancedSelectArray" class="array-input__editor">
            <template v-if="selectedIndex !== null">
                <AdvancedSelectInput v-model="items[selectedIndex]" :field="field" />
            </template>
        </div>

        <!-- Режим arrayArrayAdvancedSelect: массив массивов с AdvancedSelect -->
        <div v-else-if="isArrayArrayAdvancedSelect" class="array-input__editor">
            <template v-if="selectedIndex !== null">
                <div class="array-input__sub-array">
                    <div
                        v-for="(subItem, subIndex) in items[selectedIndex]"
                        :key="subIndex"
                        class="array-input__sub-item"
                    >
                        <AdvancedSelectInput v-model="items[selectedIndex][subIndex]" :field="field" />
                        <button class="array-input__sub-remove" @click="removeSubItem(subIndex)">✕</button>
                    </div>
                    <button class="array-input__sub-add" @click="addSubItem">+ Добавить</button>
                </div>
            </template>
        </div>

        <!-- Режим numberArray: числовое поле -->
        <div v-else-if="isNumberArray" class="array-input__editor">
            <template v-if="selectedIndex !== null">
                <input
                    type="number"
                    v-model.number="items[selectedIndex]"
                    placeholder="Введите число"
                    class="array-input__field"
                />
            </template>
        </div>

        <!-- Режим строкового массива: текстовое поле -->
        <div v-else-if="isStringArray" class="array-input__editor">
            <template v-if="selectedIndex !== null">
                <input
                    type="text"
                    v-model="items[selectedIndex]"
                    placeholder="Введите значение"
                    class="array-input__field"
                />
            </template>
        </div>

        <!-- Режим объекта: кнопка навигации -->
        <div v-else>
            <button
                v-if="selectedItem && typeof selectedItem === 'object'"
                @click="handleNavigate"
                class="array-input__nav-object-btn"
            >
                Выбрать объект →
            </button>
            <div v-else-if="selectedItem !== null" class="array-input__primitive">
                {{ String(selectedItem) }}
            </div>
            <div v-else class="array-input__empty">Нет элементов</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Ref, watch } from "vue";
import { RecordSchema, Field, AdvSelectField } from "@/types/fields/fields";
import AdvancedSelectInput from "./AdvancedSelectInput.vue";
import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { getStaticField, type ClassType } from "@/utils/classUtils";
import { Navigator } from "@/utils/navigation";
import { gameLocalization, type locales } from "@/types/localization";
import OptionsInput from "./OptionsInput.vue";

type InputType = any[];
const frameNavigator = inject<Navigator>("frameNavigator");

const props = defineProps<{
    modelValue: InputType;
    field: Field;
    labelField?: string;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: InputType): void;
    (e: "change", value: InputType): void;
}>();

const selectedIndex = ref<number | null>(props.modelValue && props.modelValue.length > 0 ? 0 : null);

const items = computed({
    get: () => {
        return props.modelValue as InputType;
    },
    set: (val: InputType) => {
        emit("update:modelValue", val);
        emit("change", val);
    },
});

// Определяем, является ли массив массивом строк
const isStringArray = computed(() => {
    return (
        props.field.type === "stringArray" ||
        (Array.isArray(items.value) && items.value.length > 0 && items.value.every((item) => typeof item === "string"))
    );
});

// Определяем, является ли массив arrayAdvancedSelect
const isAdvancedSelectArray = computed(() => {
    return props.field.type === "arrayAdvancedSelect";
});

// Определяем, является ли массив arrayArrayAdvancedSelect
const isArrayArrayAdvancedSelect = computed(() => {
    return props.field.type === "arrayArrayAdvancedSelect";
});

const isNumberArray = computed(() => {
    return (
        props.field.type === "numberArray" ||
        (Array.isArray(items.value) && items.value.length > 0 && items.value.every((item) => typeof item === "number"))
    );
});

const isOptionsArray = computed(() => {
    return props.field.type === "optionsArray";
});

const selectedItem = computed(() => {
    if (selectedIndex.value === null || selectedIndex.value >= items.value.length) {
        return null;
    }
    return items.value[selectedIndex.value];
});

const displayIndex = computed(() => {
    if (selectedIndex.value === null) return 0;
    return selectedIndex.value + 1;
});

function nextItem() {
    if (selectedIndex.value === null || selectedIndex.value >= items.value.length - 1) return;
    selectedIndex.value++;
}

function prevItem() {
    if (selectedIndex.value === null || selectedIndex.value <= 0) return;
    selectedIndex.value--;
}

function deleteItem() {
    if (selectedIndex.value === null || selectedIndex.value < 0 || selectedIndex.value > items.value.length - 1) return;

    items.value.splice(selectedIndex.value, 1);

    if (selectedIndex.value !== 0) {
        selectedIndex.value--;
    }
}

function addItem() {
    if (isArrayArrayAdvancedSelect.value) {
        items.value.push([]);
        selectedIndex.value = items.value.length - 1;
    } else if (isOptionsArray.value) {
        const defaultOption = props.field.options?.[0] ?? "";
        items.value.push(defaultOption);
        selectedIndex.value = items.value.length - 1;
    } else if (isNumberArray.value) {
        items.value.push(0);
        selectedIndex.value = items.value.length - 1;
    } else if (isStringArray.value || isAdvancedSelectArray.value) {
        items.value.push("");
        selectedIndex.value = items.value.length - 1;
    } else {
        const arrayItemSchema = props.field.arrayItemSchema;

        if (arrayItemSchema) {
            if (SchemaChoicer.isPrototypeOf(arrayItemSchema)) {
                const choosedSchema = getStaticField<SchemaChoice[]>(arrayItemSchema, "schemas")?.[0];

                if (choosedSchema) {
                    const schema = new choosedSchema.schema(
                        {},
                        {
                            schemaChooser: props.field.arrayItemSchema,
                            choosedSchema: choosedSchema,
                        }
                    );
                    items.value.push(schema.getData());

                    frameNavigator?.navigate([props.field.key, items.value.length - 1]);
                    return;
                }
            } else if (RecordSchema.isPrototypeOf(arrayItemSchema)) {
                const schema = new arrayItemSchema({}) as RecordSchema;
                items.value.push(schema.getData());
                frameNavigator?.navigate([props.field.key, items.value.length - 1]);
                return;
            }
        }

        const nestedSchema: Field["nestedSchema"] = props.field.nestedSchema;
        if (nestedSchema) {
            const schema = new nestedSchema({});
            items.value.push(schema.getData());
            frameNavigator?.navigate([props.field.key, items.value.length - 1]);
        }
    }
}

function addSubItem() {
    if (selectedIndex.value === null) return;
    const array = items.value[selectedIndex.value];
    if (!Array.isArray(array)) return;
    array.push("");
}

function removeSubItem(index: number | string) {
    if (selectedIndex.value === null) return;
    if (typeof index !== "number") return;
    const array = items.value[selectedIndex.value];
    if (!Array.isArray(array)) return;
    array.splice(index, 1);
}

function handleNavigate() {
    if (selectedIndex.value === null) return;
    frameNavigator?.navigate?.([props.field.key, selectedIndex.value]);
}

watch(
    () => props.modelValue,
    (newVal) => {
        if (!Array.isArray(newVal)) return;
        if (newVal.length === 0) {
            selectedIndex.value = null;
            return;
        }
        if (selectedIndex.value === null || selectedIndex.value >= newVal.length) {
            selectedIndex.value = 0;
        }
    },
    { immediate: true, deep: true }
);
</script>

<style scoped>
.array-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.array-input__controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.array-input__nav-btn {
    width: 28px;
    height: 28px;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    background: #333333;
    color: #e0e0e0;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.array-input__nav-btn:hover:not(:disabled) {
    background: #3d3d3d;
    border-color: #42b883;
}

.array-input__nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.array-input__counter {
    font-size: 13px;
    color: #999;
    min-width: 40px;
    text-align: center;
}

.array-input__btn {
    width: 28px;
    height: 28px;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    background: #333333;
    color: #e0e0e0;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.array-input__btn:hover {
    background: #3d3d3d;
    border-color: #42b883;
}

.array-input__editor {
    background: #2a2a2a;
    border: 1px solid #3d3d3d;
    border-radius: 6px;
    padding: 8px;
}

.array-input__field {
    width: 100%;
    padding: 8px 10px;
    background: #222222;
    border: 1px solid #3d3d3d;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
}

.array-input__field:focus {
    outline: none;
    border-color: #42b883;
}

.array-input__field[type="number"] {
    -moz-appearance: textfield;
}

.array-input__field[type="number"]::-webkit-outer-spin-button,
.array-input__field[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.array-input__select {
    width: 100%;
    padding: 8px 10px;
    background: #222222;
    border: 1px solid #3d3d3d;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
    cursor: pointer;
}

.array-input__select:focus {
    outline: none;
    border-color: #42b883;
}

.array-input__nav-object-btn {
    width: 100%;
    padding: 10px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    color: #42b883;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.array-input__nav-object-btn:hover {
    background: #42b883;
    color: #1e1e1e;
    border-color: #42b883;
}

.array-input__primitive {
    padding: 10px;
    background: #2a2a2a;
    border: 1px solid #3d3d3d;
    border-radius: 6px;
    color: #b0b0b0;
    font-size: 13px;
}

.array-input__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    background: #2a2a2a;
    border: 1px dashed #3d3d3d;
    border-radius: 6px;
    color: #666;
    font-size: 13px;
}

/* NEW styles for arrayArrayAdvancedSelect */
.array-input__sub-array {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.array-input__sub-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.array-input__sub-item .item-select {
    flex: 1;
}

.array-input__sub-remove {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    color: #888;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 12px;
}

.array-input__sub-remove:hover {
    background: #4a4a4a;
    color: #ff6b6b;
}

.array-input__sub-add {
    align-self: flex-start;
    padding: 4px 12px;
    background: transparent;
    border: 1px dashed #4a4a4a;
    border-radius: 4px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
}

.array-input__sub-add:hover {
    border-color: #42b883;
    color: #42b883;
}
</style>
