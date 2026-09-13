<!-- src/components/inputs/ArrayArrayInput.vue -->
<template>
    <div class="array-array-input">
        <!-- ===== ВНЕШНИЙ МАССИВ ===== -->
        <div class="array-array-input__group">
            <span class="array-array-input__group-label">Группа</span>
            <button
                type="button"
                class="array-array-input__nav-btn"
                @click="prevGroup"
                :disabled="groupIndex === null || groupIndex <= 0"
                title="Предыдущая группа"
            >◀</button>
            <span class="array-array-input__counter">{{ displayGroupIndex }} / {{ groups.length }}</span>
            <button
                type="button"
                class="array-array-input__nav-btn"
                @click="nextGroup"
                :disabled="groupIndex === null || groupIndex >= groups.length - 1"
                title="Следующая группа"
            >▶</button>
            <button type="button" class="array-array-input__btn" @click="addGroup" title="Добавить группу">+</button>
            <button type="button" class="array-array-input__btn" @click="deleteGroup" title="Удалить группу">-</button>
        </div>

        <!-- ===== ВНУТРЕННИЙ МАССИВ ===== -->
        <div v-if="currentGroup" class="array-array-input__sub-group">
            <span class="array-array-input__group-label">Элемент</span>
            <button
                type="button"
                class="array-array-input__nav-btn"
                @click="prevItem"
                :disabled="itemIndex === null || itemIndex <= 0"
                title="Предыдущий элемент"
            >◀</button>
            <span class="array-array-input__counter">{{ displayItemIndex }} / {{ currentGroup.length }}</span>
            <button
                type="button"
                class="array-array-input__nav-btn"
                @click="nextItem"
                :disabled="itemIndex === null || itemIndex >= currentGroup.length - 1"
                title="Следующий элемент"
            >▶</button>
            <button type="button" class="array-array-input__btn" @click="addItem" title="Добавить элемент">+</button>
            <button type="button" class="array-array-input__btn" @click="deleteItem" title="Удалить элемент">-</button>
        </div>

        <!-- ===== РЕДАКТОР ЭЛЕМЕНТА ===== -->
        <div class="array-array-input__editor">
            <template v-if="currentItem && typeof currentItem === 'object'">
                <button @click="handleNavigate" class="array-array-input__nav-object-btn">
                    {{ previewCurrentItem || "Редактировать объект" }} →
                </button>
                <div class="array-array-input__preview">{{ previewCurrentItem }}</div>
            </template>
            <div v-else-if="currentItem !== null && currentItem !== undefined" class="array-array-input__primitive">
                {{ String(currentItem) }}
            </div>
            <div v-else class="array-array-input__empty">Нет элементов</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { RecordSchema, type Field } from "@/types/fields/fields";
import { getStaticField } from "@/utils/classUtils";
import { Navigator } from "@/utils/navigation";
import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer";
import { gameLocalization } from "@/types/localization";

const frameNavigator = inject<Navigator>("frameNavigator");

const props = defineProps<{
    modelValue: Array<Array<any>>;
    field: Field;
    selectedIndex?: number;
    navigateHandler?: (key: any) => void;
    extraProps?: any;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: Array<Array<any>>): void;
}>();

const groups = computed<Array<Array<any>>>({
    get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
    set: (val) => emit("update:modelValue", val),
});

const groupIndex = ref<number | null>(
    props.selectedIndex ?? (groups.value.length > 0 ? 0 : null)
);
const itemIndex = ref<number | null>(null);

const currentGroup = computed<Array<any> | null>(() => {
    if (groupIndex.value === null) return null;
    return groups.value[groupIndex.value] ?? null;
});

const currentItem = computed<any>(() => {
    if (!currentGroup.value || itemIndex.value === null) return null;
    return currentGroup.value[itemIndex.value];
});

const displayGroupIndex = computed(() => (groupIndex.value === null ? 0 : groupIndex.value + 1));
const displayItemIndex = computed(() => (itemIndex.value === null ? 0 : itemIndex.value + 1));

const previewCurrentItem = computed(() => getRepresentation(currentItem.value));

function getRepresentation(item: any): string {
    if (!item || typeof item !== "object") return "";

	if ("_tpl" in item) {
    	return gameLocalization.getText({ localeId: [`${item._tpl} ShortName`, item._tpl], default: "" })
    }

    return "";
}

function formatValue(v: any): string {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return Array.isArray(v) ? `[${v.length}]` : "{…}";
    return String(v);
}

// ===== НАВИГАЦИЯ ВНЕШНЯЯ =====
function prevGroup() {
    if (groupIndex.value === null || groupIndex.value <= 0) return;
    groupIndex.value--;
    itemIndex.value = currentGroup.value && currentGroup.value.length > 0 ? 0 : null;
}

function nextGroup() {
    if (groupIndex.value === null || groupIndex.value >= groups.value.length - 1) return;
    groupIndex.value++;
    itemIndex.value = currentGroup.value && currentGroup.value.length > 0 ? 0 : null;
}

function addGroup() {
    groups.value.push([]);
    groupIndex.value = groups.value.length - 1;
    itemIndex.value = null;
    emit("update:modelValue", groups.value);
}

function deleteGroup() {
    if (groupIndex.value === null || groupIndex.value < 0 || groupIndex.value >= groups.value.length) return;
    groups.value.splice(groupIndex.value, 1);
    if (groups.value.length === 0) {
        groupIndex.value = null;
        itemIndex.value = null;
    } else if (groupIndex.value >= groups.value.length) {
        groupIndex.value = groups.value.length - 1;
    }
    itemIndex.value = currentGroup.value && currentGroup.value.length > 0 ? 0 : null;
    emit("update:modelValue", groups.value);
}

// ===== НАВИГАЦИЯ ВНУТРЕННЯЯ =====
function prevItem() {
    if (itemIndex.value === null || itemIndex.value <= 0) return;
    itemIndex.value--;
}

function nextItem() {
    if (!currentGroup.value || itemIndex.value === null || itemIndex.value >= currentGroup.value.length - 1) return;
    itemIndex.value++;
}

function addItem() {
    if (groupIndex.value === null) return;
    const group = groups.value[groupIndex.value];
    if (!Array.isArray(group)) return;

    const newObj = createDefaultItem();
    group.push(newObj);
    itemIndex.value = group.length - 1;
    emit("update:modelValue", groups.value);
}

function deleteItem() {
    if (!currentGroup.value || itemIndex.value === null) return;
    if (itemIndex.value < 0 || itemIndex.value >= currentGroup.value.length) return;

    if (props.field.onArrayItemDelete) props.field.onArrayItemDelete({ field: props.field, value: currentGroup.value, recordSchema: null as any, data: {} }, itemIndex.value);

    currentGroup.value.splice(itemIndex.value, 1);
    if (currentGroup.value.length === 0) {
        itemIndex.value = null;
    } else if (itemIndex.value >= currentGroup.value.length) {
        itemIndex.value = currentGroup.value.length - 1;
    }
    emit("update:modelValue", groups.value);
}

// ===== СОЗДАНИЕ ЭЛЕМЕНТА ПО СХЕМЕ =====
function createDefaultItem(): any {
    const itemSchema = props.field.arrayItemSchema;

    if (itemSchema) {
        if (SchemaChoicer.isPrototypeOf(itemSchema)) {
            const choiced = (itemSchema as typeof SchemaChoicer).schemas?.[0];
            if (choiced) {
                return new choiced.schema({}, {
                    schemaChooser: itemSchema as typeof SchemaChoicer,
                    choosedSchema: choiced,
                    isCreating: true,
                }).toJSON();
            }
        } else if (RecordSchema.isPrototypeOf(itemSchema)) {
            return new (itemSchema as typeof RecordSchema)({}, { isCreating: true }).toJSON();
        }
    }

    if (props.field.nestedSchema) {
        return new props.field.nestedSchema({}, { fillWithDefault: true, isCreating: true }).toJSON();
    }

    return {};
}

// ===== НАВИГАЦИЯ В ОБЪЕКТ =====
function handleNavigate() {
    if (groupIndex.value === null || itemIndex.value === null) return;
    if (props.field.onArrayNavigate) {
        props.field.onArrayNavigate({ field: props.field, value: groups.value, recordSchema: null as any, data: {} }, groupIndex.value);
        return;
    }
    const nav = props.navigateHandler ?? frameNavigator?.navigate;
    if (nav) nav([props.field.key, groupIndex.value, itemIndex.value]);
}

// ===== ЭКСПОРТ СОСТОЯНИЯ (для навигатора) =====
function getSavedData() {
    return {
        groupIndex: groupIndex.value,
        itemIndex: itemIndex.value,
    };
}

defineExpose({ getSavedData });

// ===== WATCHERS =====
watch(
    () => props.modelValue,
    (newVal) => {
        if (!Array.isArray(newVal)) return;
        if (newVal.length === 0) {
            groupIndex.value = null;
            itemIndex.value = null;
            return;
        }
        if (groupIndex.value === null || groupIndex.value >= newVal.length) {
            groupIndex.value = 0;
        }
        const group = newVal[groupIndex.value];
        if (!Array.isArray(group) || group.length === 0) {
            itemIndex.value = null;
        } else if (itemIndex.value === null || itemIndex.value >= group.length) {
            itemIndex.value = 0;
        }
    },
    { immediate: true, deep: true }
);

watch(currentGroup, (newGroup) => {
    if (!Array.isArray(newGroup) || newGroup.length === 0) {
        itemIndex.value = null;
    } else if (itemIndex.value === null || itemIndex.value >= newGroup.length) {
        itemIndex.value = 0;
    }
});
</script>

<style scoped>
.array-array-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.array-array-input__group,
.array-array-input__sub-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
}

.array-array-input__sub-group {
    padding-left: 12px;
    border-left: 2px solid #42b88355;
}

.array-array-input__group-label {
    font-size: 12px;
    color: #888;
    min-width: 60px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.array-array-input__nav-btn {
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

.array-array-input__nav-btn:hover:not(:disabled) {
    background: #3d3d3d;
    border-color: #42b883;
}

.array-array-input__nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.array-array-input__counter {
    font-size: 13px;
    color: #999;
    min-width: 40px;
    text-align: center;
}

.array-array-input__btn {
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

.array-array-input__btn:hover {
    background: #3d3d3d;
    border-color: #42b883;
}

.array-array-input__editor {
    background: #2a2a2a;
    border: 1px solid #3d3d3d;
    border-radius: 6px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.array-array-input__nav-object-btn {
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

.array-array-input__nav-object-btn:hover {
    background: #42b883;
    color: #1e1e1e;
    border-color: #42b883;
}

.array-array-input__preview {
    font-size: 12px;
    color: #999;
    font-family: "Consolas", "Monaco", monospace;
    padding: 4px 8px;
    word-break: break-word;
}

.array-array-input__primitive {
    padding: 8px 10px;
    background: #222;
    border: 1px solid #3d3d3d;
    border-radius: 4px;
    color: #b0b0b0;
    font-size: 13px;
}

.array-array-input__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    background: #222;
    border: 1px dashed #3d3d3d;
    border-radius: 6px;
    color: #666;
    font-size: 13px;
}
</style>
