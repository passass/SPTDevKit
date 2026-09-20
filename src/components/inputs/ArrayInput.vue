// src/components/inputs/ArrayInput.vue
<template>
    <div class="array-input">
        <div class="array-input__controls">
            <button
                type="button"
                class="array-input__nav-btn"
                @click="prevItem"
                :disabled="selectedIndex === null || items.length <= 1"
                :title="uitext('previous')"
            >
                ◀
            </button>

            <span class="array-input__counter"> {{ displayIndex }} / {{ items?.length ?? 0 }} </span>

            <button
                type="button"
                class="array-input__nav-btn"
                @click="nextItem"
                :disabled="selectedIndex === null || items.length <= 1"
                :title="uitext('next')"
            >
                ▶
            </button>

            <button
                type="button"
                class="array-input__btn"
                @click="moveUp"
                :disabled="selectedIndex === null || selectedIndex >= items.length - 1"
                :title="uitext('moveUp')"
            >
                ↑
            </button>

            <button
                type="button"
                class="array-input__btn"
                @click="moveDown"
                :disabled="selectedIndex === null || selectedIndex <= 0"
                :title="uitext('moveDown')"
            >
                ↓
            </button>

            <button type="button" class="array-input__btn" @click="addItem" :title="uitext('add')">+</button>

            <button class="array-input__btn" @click="deleteItem" :title="uitext('delete')">-</button>
        </div>

        <!-- Режим optionsArray: select -->
        <div v-if="isOptionsArray" class="array-input__editor">
            <template v-if="selectedIndex !== null && Array.isArray(items)">
                <OptionsInput v-model="items[selectedIndex]" :field="field" :data="items" />
            </template>
        </div>

        <!-- Режим arrayAdvancedSelect: выбор из справочника -->
        <div v-else-if="isAdvancedSelectArray" class="array-input__editor">
            <template v-if="selectedIndex !== null && typeof items[selectedIndex] === 'string'">
                <AdvancedSelectInput v-model="items[selectedIndex] as string" :fieldContext="fieldContext" />
            </template>
        </div>

        <!-- Режим arrayArrayAdvancedSelect: массив массивов с AdvancedSelect -->
        <div v-else-if="isArrayArrayAdvancedSelect" class="array-input__editor">
            <template v-if="currentSubArray">
                <div class="array-input__sub-array">
                    <div
                        v-for="(subItem, subIndex) in currentSubArray"
                        :key="subIndex"
                        class="array-input__sub-item"
                    >
                        <AdvancedSelectInput v-model="currentSubArray[subIndex]"  :fieldContext="fieldContext" />
                        <button class="array-input__sub-remove" @click="removeSubItem(subIndex)">✕</button>
                    </div>
                    <button class="array-input__sub-add" @click="addSubItem">+ {{uitext('add')}}</button>
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
                    :placeholder="uitext('enterValue')"
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
                {{ getRepresentation(selectedItem) || uitext('selectItem') }} →
            </button>
            <div v-else-if="selectedItem !== null" class="array-input__primitive">
                {{ String(selectedItem) }}
            </div>
            <div v-else class="array-input__empty">{{uitext('noElements')}}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { RecordSchema, Field, type SchemaValue } from "@/types/fields/fields";
import AdvancedSelectInput from "./AdvancedSelectInput.vue";
import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { getStaticField } from "@/utils/classUtils";
import { Navigator } from "@/utils/navigation";
import OptionsInput from "./OptionsInput.vue";
import { type FieldContext } from "@/types/fields/fieldsConsts";
import { gameLocalization, uitext } from "@/types/localization";
import { isInDestructureAssignment } from "vue/compiler-sfc";
import { itemsDataStore } from "@/project/Items";

type InputType = SchemaValue[];
const frameNavigator = inject<Navigator>("frameNavigator");

const props = defineProps<{
    modelValue: Array<any>;
    field: Field;
    selectedIndex?: number;
    fieldContext: FieldContext;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: InputType): void;
    (e: "onNavigate", key: any): void;
}>();

const selectedIndex = ref<number | null>(
    props.selectedIndex ?? (props.modelValue && props.modelValue.length > 0 ? 0 : null)
);

const items = computed({
    get: () => {
        return props.modelValue as InputType;
    },
    set: (val: InputType) => {
        emit("update:modelValue", val);
    },
});

function moveUp() {
	const idx = selectedIndex.value;
	if (idx === null || idx >= items.value.length - 1) return;
    const arr = items.value;

    const [moved] = arr.splice(idx, 1);
    arr.splice(idx + 1, 0, moved);

    selectedIndex.value = idx + 1;
    emit("update:modelValue", arr);
}

function moveDown() {
	const idx = selectedIndex.value;
	if (idx === null || idx <= 0) return;
    const arr = items.value;

    const [moved] = arr.splice(idx, 1);
	arr.splice(idx - 1, 0, moved);

    selectedIndex.value = idx - 1;
    emit("update:modelValue", arr);
}

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

const currentSubArray = computed<any[] | null>(() => {
    if (selectedIndex.value === null) return null;
    const arr = items.value[selectedIndex.value];
    return Array.isArray(arr) ? arr : null;
});

function nextItem() {
	if (selectedIndex.value === null) return;
	if (selectedIndex.value >= items.value.length - 1)
		selectedIndex.value = 0
	else
    	selectedIndex.value++;
}

function prevItem() {
	if (selectedIndex.value === null) return;
	if (selectedIndex.value <= 0)
		selectedIndex.value = items.value.length - 1
	else
    	selectedIndex.value--;
}

function deleteItem() {
    if (selectedIndex.value === null || selectedIndex.value < 0 || selectedIndex.value > items.value.length - 1) return;
    if (props.field.onArrayItemDelete && props.field.onArrayItemDelete(props.fieldContext, selectedIndex.value)) return;
    items.value.splice(selectedIndex.value, 1);

    if (selectedIndex.value !== 0) {
        selectedIndex.value--;
    } else {
        selectedIndex.value = null;
    }
}

function addItem() {
    const arr = items.value ?? [];
    const lastLength = arr.length;
    if (isArrayArrayAdvancedSelect.value) {
        arr.push([]);
        selectedIndex.value = arr.length - 1;
        emit("update:modelValue", arr);
    } else if (isOptionsArray.value) {
        if (props.field.options?.length === 0) return;
        const defaultOption =
            (props.field.options &&
                (Array.isArray(props.field.options)
                    ? props.field.options[0]
                    : Object.values(props.field.options)[0])) ??
            "";
        arr.push(defaultOption);
        selectedIndex.value = arr.length - 1;
        emit("update:modelValue", arr);
    } else if (isNumberArray.value) {
        arr.push(0);
        selectedIndex.value = arr.length - 1;
        emit("update:modelValue", arr);
    } else if (isStringArray.value || isAdvancedSelectArray.value) {
        arr.push("");
        selectedIndex.value = arr.length - 1;
        emit("update:modelValue", arr);
    } else {
        const arrayItemSchema = props.field.arrayItemSchema;
		let resultSchema: RecordSchema | undefined;

        if (arrayItemSchema) {
            if (SchemaChoicer.isPrototypeOf(arrayItemSchema)) {
                const choosedSchema = getStaticField<SchemaChoice[]>(arrayItemSchema, "schemas")?.[0];

				if (choosedSchema) {
                    resultSchema = new choosedSchema.schema(
                        {},
                        {
                            schemaChooser: (props.field.arrayItemSchema as typeof SchemaChoicer),
							choosedSchema: choosedSchema,
                            isCreating: true,
                        }
                    );
                }
            } else if (RecordSchema.isPrototypeOf(arrayItemSchema)) {
                resultSchema = new arrayItemSchema(
                    {},
                    {
                    	isCreating: true,
                    }
                ) as RecordSchema;
            }
        }

        if (!resultSchema) {
            const nestedSchema: Field["nestedSchema"] = props.field.nestedSchema;
            if (nestedSchema) {
                resultSchema = new nestedSchema(
                    {},
                    {
                    	isCreating: true,
                    }
                );
            }
        }

        if (resultSchema) {
            arr.push(resultSchema.toJSON());
            emit("update:modelValue", arr);
            frameNavigator?.navigate([props.field.key, arr.length - 1]);
        }
    }

    if (props.field.onArrayItemAdd && lastLength !== arr.length) {
        props.field.onArrayItemAdd(props.fieldContext, arr[arr.length - 1]);
    }
}

function getRepresentation(item: any): string {
    if (!item || typeof item !== "object") return "";

	if ("_tpl" in item) {
    	return gameLocalization.getText({ localeId: [`${item._tpl} ShortName`, item._tpl], default: "" })
	}

	const arrSchema = props.field.arrayItemSchema
	if (arrSchema && arrSchema.from({})?.getRepresentation) {
		const res = arrSchema.from(item)?.getRepresentation!()
		if (res)
			return res
	}

    return "";
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
	if (selectedIndex.value !== null) {
		if (props.field.onArrayNavigate)
	        props.field.onArrayNavigate(props.fieldContext, selectedIndex.value);
	    else if (props.fieldContext.navigate) {
	        props.fieldContext.navigate([props.field.key, selectedIndex.value]);
	    }
	}

}

function getSavedData() {
    return {
        selectedIndex: selectedIndex.value,
    };
}

defineExpose({
    getSavedData,
});

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
