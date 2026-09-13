<!-- src/components/inputs/MapInput.vue -->
<template>
    <div class="map-input">
        <div class="map-input__controls">
            <button type="button" class="map-input__btn" @click="addEntry" title="Добавить запись">+</button>
            <span class="map-input__counter">{{ entries.length }} {{ entries.length === 1 ? "запись" : "записей" }}</span>
            <input
                v-model="searchQuery"
                type="text"
                class="map-input__search"
                placeholder="Поиск по ключу..."
            />
        </div>

        <div v-if="filteredEntries.length === 0" class="map-input__empty">
            Нет записей
        </div>

        <div v-else class="map-input__list">
            <div
                v-for="[key, value] in filteredEntries"
                :key="String(key)"
                class="map-input__entry"
                :class="{ 'map-input__entry--expanded': expandedKey === key }"
            >
                <div class="map-input__entry-header" @click="toggleExpand(key)">
                    <span class="map-input__arrow">{{ expandedKey === key ? "▼" : "▶" }}</span>
                    <input
                        v-if="editingKey === key"
                        ref="keyInputRef"
                        v-model="editingKeyValue"
                        type="text"
                        class="map-input__key-input"
                        @click.stop
                        @keydown.enter="commitKeyEdit(key)"
                        @keydown.esc="cancelKeyEdit"
                        @blur="commitKeyEdit(key)"
                    />
                    <span v-else class="map-input__key" @dblclick.stop="startKeyEdit(key)">{{ key }}</span>

                    <span class="map-input__value-preview">{{ getValuePreview(value) }}</span>

                    <div class="map-input__entry-actions" @click.stop>
                        <button class="map-input__action-btn" @click="startKeyEdit(key)" title="Переименовать">✎</button>
                        <button class="map-input__action-btn map-input__action-btn--danger" @click="removeEntry(key)" title="Удалить">✕</button>
                    </div>
                </div>

                <div v-if="expandedKey === key" class="map-input__entry-body">
                    <AdvancedSelectInput
                        v-if="isAdvancedSelectValue"
                        v-model="valueRef[key] as string"
                        :fieldContext="valueFieldContext"
                    />
                    <OptionsInput
                        v-else-if="isOptionsValue"
                        v-model="valueRef[key]"
                        :field="valueField"
                        :data="valueRef"
                    />
                    <input
                        v-else-if="isNumberValue"
                        type="number"
                        v-model.number="valueRef[key]"
                        class="map-input__field"
                    />
                    <input
                        v-else-if="isBooleanValue"
                        type="checkbox"
                        v-model="valueRef[key]"
                        class="map-input__checkbox"
                    />
                    <input
                        v-else
                        type="text"
                        v-model="valueRef[key]"
                        class="map-input__field"
                        placeholder="Значение"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, nextTick } from "vue";
import { Field, RecordSchema, type SchemaData, type SchemaValue } from "@/types/fields/fields";
import AdvancedSelectInput from "./AdvancedSelectInput.vue";
import OptionsInput from "./OptionsInput.vue";
import { type FieldContext } from "@/types/fields/fieldsConsts";
import { Navigator } from "@/utils/navigation";
import { gameLocalization } from "@/types/localization";

const props = defineProps<{
    modelValue: Map<string | number, any> | Record<string, any> | undefined;
    field: Field;
    fieldContext?: FieldContext;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: Map<string | number, any> | Record<string, any>): void;
}>();

const frameNavigator = inject<Navigator | null>("frameNavigator", null);

const searchQuery = ref("");
const expandedKey = ref<string | number | null>(null);
const editingKey = ref<string | number | null>(null);
const editingKeyValue = ref("");
const keyInputRef = ref<HTMLInputElement | null>(null);

const isMapInstance = computed(() => props.modelValue instanceof Map);

const valueRef = computed<Record<string | number, any>>({
    get: () => {
        if (!props.modelValue) return {};
        if (isMapInstance.value) {
            return Object.fromEntries((props.modelValue as Map<string | number, any>).entries());
        }
        return props.modelValue as Record<string | number, any>;
    },
    set: (val) => {
        if (isMapInstance.value) {
            emit("update:modelValue", new Map(Object.entries(val)));
        } else {
            emit("update:modelValue", val);
        }
    },
});

const entries = computed<Array<[string | number, any]>>(() => {
    if (!props.modelValue) return [];
    if (isMapInstance.value) {
        return Array.from((props.modelValue as Map<string | number, any>).entries());
    }
    return Object.entries(props.modelValue as Record<string, any>);
});

const filteredEntries = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return entries.value;
    return entries.value.filter(([key, value]) => {
        if (String(key).toLowerCase().includes(q)) return true;
        if (typeof value === "string" && value.toLowerCase().includes(q)) return true;
        return false;
    });
});

const valueField = computed<Field>(() => {
    return Field.create({
        key: "__mapValue",
        label: "Значение",
        type: (props.field.arrayItemSchema instanceof Field ? props.field.arrayItemSchema.type : "text") as any,
        options: props.field.options as any,
    });
});

const valueFieldContext = computed<FieldContext>(() => ({
    field: valueField.value,
    value: undefined,
    recordSchema: props.fieldContext?.recordSchema as RecordSchema ?? ({} as RecordSchema),
    data: valueRef.value,
    navigate: frameNavigator?.navigate,
}));

const isAdvancedSelectValue = computed(() => props.field.type === "arrayAdvancedSelect" || (props.field as any).storeId);
const isOptionsValue = computed(() => props.field.type === "select" || props.field.type === "optionsArray");
const isNumberValue = computed(() => {
    if (props.field.type === "numberArray") return true;
    return entries.value.some(([, v]) => typeof v === "number");
});
const isBooleanValue = computed(() => entries.value.some(([, v]) => typeof v === "boolean"));

function getValuePreview(value: any): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
        if (value instanceof RecordSchema) {
            return value.getSchemaLabel?.() ?? value.getId() ?? "{...}";
        }
        return gameLocalization.getObjectLocalization({ instance: value }) || "{...}";
    }
    if (typeof value === "string" && value.length > 60) return value.slice(0, 60) + "…";
    return String(value);
}

function toggleExpand(key: string | number): void {
    if (editingKey.value === key) return;
    expandedKey.value = expandedKey.value === key ? null : key;
}

function addEntry(): void {
    const ref = valueRef.value;
    let newKey = "newKey";
    let i = 1;
    while (newKey in ref) {
        newKey = `newKey${i++}`;
    }
    ref[newKey] = getDefaultValue();
    valueRef.value = ref;
    expandedKey.value = newKey;
    nextTick(() => startKeyEdit(newKey));
}

function removeEntry(key: string | number): void {
    const ref = valueRef.value;
    delete ref[key];
    valueRef.value = ref;
    if (expandedKey.value === key) expandedKey.value = null;
    if (editingKey.value === key) editingKey.value = null;
}

function getDefaultValue(): any {
    if (isAdvancedSelectValue.value || isOptionsValue.value) return "";
    if (isNumberValue.value) return 0;
    if (isBooleanValue.value) return false;
    return "";
}

function startKeyEdit(key: string | number): void {
    editingKey.value = key;
    editingKeyValue.value = String(key);
    nextTick(() => {
        keyInputRef.value?.focus();
        keyInputRef.value?.select();
    });
}

function cancelKeyEdit(): void {
    editingKey.value = null;
    editingKeyValue.value = "";
}

function commitKeyEdit(oldKey: string | number): void {
    if (editingKey.value === null) return;
    const newKey = editingKeyValue.value.trim();
    if (!newKey || newKey === String(oldKey)) {
        cancelKeyEdit();
        return;
    }
    const ref = valueRef.value;
    if (newKey in ref && newKey !== String(oldKey)) {
        cancelKeyEdit();
        return;
    }
    const value = ref[oldKey];
    delete ref[oldKey];
    ref[newKey] = value;
    valueRef.value = ref;
    if (expandedKey.value === oldKey) expandedKey.value = newKey;
    cancelKeyEdit();
}

function getSavedData() {
    return {
        expandedKey: expandedKey.value,
    };
}

defineExpose({
    getSavedData,
});
</script>

<style scoped>
.map-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.map-input__controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.map-input__btn {
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

.map-input__btn:hover {
    background: #3d3d3d;
    border-color: #42b883;
}

.map-input__counter {
    font-size: 13px;
    color: #999;
    min-width: 80px;
}

.map-input__search {
    flex: 1;
    padding: 4px 8px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    min-width: 100px;
}

.map-input__search:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.map-input__empty {
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

.map-input__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.map-input__entry {
    background: #2a2a2a;
    border: 1px solid #3d3d3d;
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 0.2s;
}

.map-input__entry--expanded {
    border-color: #42b883;
}

.map-input__entry-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
}

.map-input__entry-header:hover {
    background: #333333;
}

.map-input__arrow {
    color: #888;
    font-size: 10px;
    width: 12px;
    flex-shrink: 0;
}

.map-input__key {
    font-size: 13px;
    font-weight: 500;
    color: #66d9a0;
    font-family: "Consolas", "Monaco", monospace;
    flex-shrink: 0;
    max-width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.map-input__key-input {
    font-size: 13px;
    font-family: "Consolas", "Monaco", monospace;
    color: #66d9a0;
    background: #1e1e1e;
    border: 1px solid #42b883;
    border-radius: 4px;
    padding: 2px 6px;
    outline: none;
    max-width: 40%;
}

.map-input__value-preview {
    flex: 1;
    font-size: 12px;
    color: #999;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}

.map-input__entry-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
}

.map-input__entry-header:hover .map-input__entry-actions {
    opacity: 1;
}

.map-input__action-btn {
    width: 22px;
    height: 22px;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    background: transparent;
    color: #888;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.map-input__action-btn:hover {
    background: #4a4a4a;
    color: #e0e0e0;
}

.map-input__action-btn--danger:hover {
    background: rgba(255, 70, 70, 0.2);
    color: #ff6b6b;
}

.map-input__entry-body {
    padding: 8px 10px 10px 30px;
    background: rgba(0, 0, 0, 0.15);
    border-top: 1px solid #3d3d3d;
}

.map-input__field {
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

.map-input__field:focus {
    outline: none;
    border-color: #42b883;
}

.map-input__field[type="number"] {
    -moz-appearance: textfield;
}

.map-input__field[type="number"]::-webkit-outer-spin-button,
.map-input__field[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.map-input__checkbox {
    width: 18px;
    height: 18px;
    accent-color: #42b883;
    cursor: pointer;
}
</style>
