<!-- src/components/inputs/ArrayListInput.vue -->
<template>
    <div class="array-list-input">
        <div class="array-list-input__toolbar">
            <input
                v-model="searchQuery"
                type="text"
                class="array-list-input__search"
                placeholder="Поиск..."
            />
            <button type="button" class="array-list-input__btn" @click="addItem" title="Добавить">+</button>
            <button
                type="button"
                class="array-list-input__btn array-list-input__btn--danger"
                @click="deleteItem"
                :disabled="selectedIndex === null"
                title="Удалить выбранный"
            >−</button>
        </div>

        <div class="array-list-input__list" ref="listRef">
            <div v-if="filteredItems.length === 0" class="array-list-input__empty">
                {{ items.length === 0 ? "Нет элементов" : "Ничего не найдено" }}
            </div>
            <div
                v-for="entry in filteredItems"
                :key="entry.index"
                class="array-list-input__row"
                :class="{ active: selectedIndex === entry.index }"
                @click="selectIndex(entry.index)"
            >
                <span class="array-list-input__row-index">{{ entry.index + 1 }}</span>
                <span class="array-list-input__row-label" :title="entry.label">{{ entry.label }}</span>
                <button
                    class="array-list-input__row-remove"
                    @click.stop="removeAt(entry.index)"
                    title="Удалить"
                >✕</button>
            </div>
        </div>

        <!-- ===== РЕДАКТОР ВЫБРАННОГО ===== -->
        <div v-if="selectedIndex !== null" class="array-list-input__editor">
            <!-- optionsArray -->
            <template v-if="isOptionsArray">
                <OptionsInput v-model="items[selectedIndex]" :field="field" :data="items" />
            </template>

            <!-- arrayAdvancedSelect -->
            <template v-else-if="isAdvancedSelectArray">
                <AdvancedSelectInput
                    v-if="typeof items[selectedIndex] === 'string'"
                    v-model="items[selectedIndex] as string"
                    :fieldContext="fieldContext"
                />
            </template>

            <!-- numberArray -->
            <template v-else-if="isNumberArray">
                <input
                    type="number"
                    v-model.number="items[selectedIndex]"
                    placeholder="Введите число"
                    class="array-list-input__field"
                />
            </template>

            <!-- stringArray -->
            <template v-else-if="isStringArray">
                <input
                    type="text"
                    v-model="items[selectedIndex]"
                    placeholder="Введите значение"
                    class="array-list-input__field"
                />
            </template>

            <!-- object -->
            <template v-else-if="typeof items[selectedIndex] === 'object'">
                <button @click="handleNavigate" class="array-list-input__nav-object-btn">
                    Редактировать →
                </button>
            </template>

            <template v-else>
                <div class="array-list-input__primitive">{{ String(items[selectedIndex]) }}</div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { RecordSchema, Field, type SchemaValue } from "@/types/fields/fields";
import AdvancedSelectInput from "./AdvancedSelectInput.vue";
import OptionsInput from "./OptionsInput.vue";
import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { getStaticField } from "@/utils/classUtils";
import { Navigator } from "@/utils/navigation";
import { type FieldContext } from "@/types/fields/fieldsConsts";
import { gameLocalization } from "@/types/localization";

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

const searchQuery = ref("");
const listRef = ref<HTMLElement | null>(null);

const selectedIndex = ref<number | null>(
    props.selectedIndex ?? (props.modelValue && props.modelValue.length > 0 ? 0 : null)
);

const items = computed({
    get: () => props.modelValue as InputType,
    set: (val: InputType) => emit("update:modelValue", val),
});

const isStringArray = computed(() => {
    return (
        props.field.type === "stringArray" ||
        (Array.isArray(items.value) && items.value.length > 0 && items.value.every((item) => typeof item === "string"))
    );
});

const isAdvancedSelectArray = computed(() => props.field.type === "arrayAdvancedSelect");

const isNumberArray = computed(() => {
    return (
        props.field.type === "numberArray" ||
        (Array.isArray(items.value) && items.value.length > 0 && items.value.every((item) => typeof item === "number"))
    );
});

const isOptionsArray = computed(() => props.field.type === "optionsArray");

function getRepresentation(item: any, index: number): string {
	if (item === null || item === undefined) return "—";


	if ("_tpl" in item || item instanceof RecordSchema && item.has("_tpl")) {
		const tpl = item instanceof RecordSchema ? item.get("_tpl") : item["_tpl"]
    	return gameLocalization.getText({ localeId: [`${tpl} Name`, `${tpl} ShortName`, tpl], default: "" })
    }

    if (typeof item !== "object") return String(item);
    if (item instanceof RecordSchema) {
        const fields = item.getVisibleFields();
        const parts: string[] = [];
        for (const field of fields) {
            if (field.virtual) continue;
            if (field.type === "object" || field.isArray() || field.nestedSchema || field.arrayItemSchema) continue;
            const value = item.get(field.key);
            if (value === undefined || value === null || value === "") continue;
            parts.push(
                `${gameLocalization.getUIText({ localeId: [field.key, field.label], default: field.label })}: ${String(value)}`
            );
            if (parts.length >= 2) break;
        }
        return parts.join(", ") || (item.getId?.() ?? `#${index + 1}`);
    }
    const data = item as Record<string, any>;
    const parts: string[] = [];
    for (const key of Object.keys(data)) {
        const value = data[key];
        if (value === undefined || value === null || value === "") continue;
        if (typeof value === "object") continue;
        parts.push(`${gameLocalization.getUIText({ localeId: key, default: key })}: ${String(value)}`);
        if (parts.length >= 2) break;
    }
    return parts.join(", ") || `#${index + 1}`;
}

const entries = computed(() =>
    (items.value ?? []).map((item, index) => ({
        index,
        item,
        label: getRepresentation(item, index),
    }))
);

const filteredItems = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return entries.value;
    return entries.value.filter(
        (entry) =>
            entry.label.toLowerCase().includes(q) ||
            String(entry.index + 1).includes(q)
    );
});

// ===== ДЕЙСТВИЯ =====
function selectIndex(index: number) {
    selectedIndex.value = index;
}

function removeAt(index: number) {
    if (index < 0 || index >= items.value.length) return;
    if (props.field.onArrayItemDelete && props.field.onArrayItemDelete(props.fieldContext, index)) return;
    items.value.splice(index, 1);
    if (items.value.length === 0) {
        selectedIndex.value = null;
    } else if (selectedIndex.value !== null && selectedIndex.value >= items.value.length) {
        selectedIndex.value = items.value.length - 1;
    }
    emit("update:modelValue", items.value);
}

function deleteItem() {
    if (selectedIndex.value === null) return;
    removeAt(selectedIndex.value);
}

function addItem() {
    const arr = items.value ?? [];
    const lastLength = arr.length;

    if (isOptionsArray.value) {
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
                            schemaChooser: arrayItemSchema as typeof SchemaChoicer,
                            choosedSchema: choosedSchema,
                            isCreating: true,
                        }
                    );
                }
            } else if (RecordSchema.isPrototypeOf(arrayItemSchema)) {
                resultSchema = new (arrayItemSchema as typeof RecordSchema)({}, { isCreating: true });
            }
        }

        if (!resultSchema) {
            const nestedSchema: Field["nestedSchema"] = props.field.nestedSchema;
            if (nestedSchema) {
                resultSchema = new nestedSchema({}, { fillWithDefault: true, isCreating: true });
            }
        }

        if (resultSchema) {
            arr.push(resultSchema.toJSON());
            emit("update:modelValue", arr);
            selectedIndex.value = arr.length - 1;
        }
    }

    if (props.field.onArrayItemAdd && lastLength !== arr.length) {
        props.field.onArrayItemAdd(props.fieldContext, arr[arr.length - 1]);
    }
}

function handleNavigate() {
    if (selectedIndex.value === null) return;
    if (props.field.onArrayNavigate) {
        props.field.onArrayNavigate(props.fieldContext, selectedIndex.value);
    } else if (props.fieldContext.navigate) {
        props.fieldContext.navigate([props.field.key, selectedIndex.value]);
    }
}

function getSavedData() {
    return {
        selectedIndex: selectedIndex.value,
    };
}

defineExpose({ getSavedData });

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
.array-list-input {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.array-list-input__toolbar {
    display: flex;
    gap: 6px;
    align-items: center;
}

.array-list-input__search {
    flex: 1;
    padding: 4px 8px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 12px;
    min-width: 80px;
    height: 24px;
    box-sizing: border-box;
}

.array-list-input__search:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.array-list-input__btn {
    width: 24px;
    height: 24px;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    background: #333333;
    color: #e0e0e0;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
    padding: 0;
}

.array-list-input__btn:hover:not(:disabled) {
    background: #3d3d3d;
    border-color: #42b883;
}

.array-list-input__btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.array-list-input__btn--danger:hover:not(:disabled) {
    border-color: #ff6b6b;
    color: #ff6b6b;
}

.array-list-input__list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: 220px;
    overflow-y: auto;
    background: #1e1e1e;
    border: 1px solid #3d3d3d;
    border-radius: 4px;
    padding: 2px;
}

.array-list-input__list::-webkit-scrollbar {
    width: 6px;
}
.array-list-input__list::-webkit-scrollbar-track {
    background: transparent;
}
.array-list-input__list::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 3px;
}

.array-list-input__empty {
    padding: 10px;
    text-align: center;
    color: #666;
    font-size: 12px;
}

.array-list-input__row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    min-height: 22px;
    cursor: pointer;
    border-radius: 3px;
    transition: background 0.1s;
    user-select: none;
}

.array-list-input__row:hover {
    background: #2d2d2d;
}

.array-list-input__row.active {
    background: #3d3d3d;
    outline: 1px solid #42b88355;
}

.array-list-input__row-index {
    font-size: 10px;
    color: #666;
    min-width: 18px;
    text-align: right;
    font-family: "Consolas", "Monaco", monospace;
    flex-shrink: 0;
}

.array-list-input__row-label {
    flex: 1;
    font-size: 12px;
    color: #c8c8c8;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}

.array-list-input__row.active .array-list-input__row-label {
    color: #e0e0e0;
}

.array-list-input__row-remove {
    width: 18px;
    height: 18px;
    border: none;
    background: transparent;
    color: #666;
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    flex-shrink: 0;
    opacity: 0;
    transition: all 0.15s;
    padding: 0;
}

.array-list-input__row:hover .array-list-input__row-remove {
    opacity: 1;
}

.array-list-input__row-remove:hover {
    background: rgba(255, 70, 70, 0.2);
    color: #ff6b6b;
}

.array-list-input__editor {
    background: #2a2a2a;
    border: 1px solid #3d3d3d;
    border-radius: 6px;
    padding: 8px;
}

.array-list-input__field {
    width: 100%;
    padding: 6px 10px;
    background: #222222;
    border: 1px solid #3d3d3d;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
}

.array-list-input__field:focus {
    outline: none;
    border-color: #42b883;
}

.array-list-input__field[type="number"] {
    -moz-appearance: textfield;
}

.array-list-input__field[type="number"]::-webkit-outer-spin-button,
.array-list-input__field[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.array-list-input__nav-object-btn {
    width: 100%;
    padding: 8px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    color: #42b883;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
}

.array-list-input__nav-object-btn:hover {
    background: #42b883;
    color: #1e1e1e;
    border-color: #42b883;
}

.array-list-input__primitive {
    padding: 8px;
    background: #222;
    border: 1px solid #3d3d3d;
    border-radius: 4px;
    color: #b0b0b0;
    font-size: 13px;
}
</style>
