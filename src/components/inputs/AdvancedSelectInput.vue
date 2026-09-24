// src/components/inputs/ItemSelectInput.vue

<template>
    <div class="item-select">
        <div class="item-select__search">
            <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Поиск..."
                class="item-select__input"
                @focus="isOpen = true"
                @input="handleSearch"
                @keydown.esc="closeDropdown"
                @keydown.down="selectNext"
                @keydown.up="selectPrev"
                @keydown.enter="selectCurrent"
            />
            <button v-if="modelValue" class="item-select__clear" @click="clearSelection" title="Очистить">✕</button>
        </div>

        <div v-if="isOpen && filteredItems.length > 0" class="item-select__dropdown">
            <div
                v-for="(item, index) in filteredItems"
                :key="item.shownId ?? item.id"
                :class="['item-select__option', { active: selectedIndex === index }]"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = index"
            >
                <span class="item-select__option-name">{{ item.label }}</span>
                <span class="item-select__option-id">{{ item.shownId ?? item.id }}</span>
            </div>
        </div>

        <div v-if="isOpen && filteredItems.length === 0 && searchQuery" class="item-select__empty">
            Ничего не найдено
        </div>

        <div v-if="selectedItemLabel && !isOpen" class="item-select__selected">
            <span class="item-select__selected-name">{{ selectedItemLabel }}</span>
            <span class="item-select__selected-id">{{ modelValue }}</span>
        </div>
    </div>
</template>

<script setup lang="tsx">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useDataStore } from "@/stores/dataStore";
import { gameLocalization, translateId } from "@/types/localization";
import { AdvSelectField, RecordSchema, type Field } from "@/types/fields/fields";
import { FieldContext } from "@/types/fields/fieldsConsts";
import { ISelectItem } from "@/consts/AdvancedSelectInputConsts";

const props = defineProps<{
    modelValue: any;
    fieldContext?: FieldContext;

    itemsOverride?: Map<string | number, Record<string, any> | RecordSchema | string>;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string | null): void;
}>();

const dataStore = useDataStore();
const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");
const isOpen = ref(false);
const selectedIndex = ref(-1);

const items = computed(() => {
    const result: Array<ISelectItem> = [];
    if (!props.fieldContext && props.itemsOverride === undefined) return result;

    if (props.fieldContext?.field?.getOptionsItems) {
		const items = props.fieldContext.field.getOptionsItems(props.fieldContext);

        for (const [_id, item] of items) {
            let record;
            let id;
            let shownId;

            if (typeof item === "object" && !(item instanceof RecordSchema)) {
                record = item.record;
                id = item.id;
                shownId = item.shownId;
            } else {
                record = item;
                id = _id;
                shownId = _id;
            }

            let name;
            if (record instanceof RecordSchema) {
                if (record.getRepresentation) name = record.getRepresentation();
                else name = gameLocalization.getObjectLocalization({ instance: item });
            } else if (typeof record === "string")
                name = translateId(record);
            else name = String(record);

            const resultObject: ISelectItem = {
                id,
                shownId,
                label: name ?? id,
            };

            if (record instanceof RecordSchema) resultObject["record"] = record;
            result.push(resultObject);
        }

        return result;
    }

    const itemMap: Map<string | number, Record<string, any> | RecordSchema | string> =
        props.itemsOverride ??
        (props.fieldContext
            ? dataStore.getMap(props.fieldContext?.field?.storeId ?? "items")
            : new Map());

    for (const [id, record] of itemMap.entries()) {
        let data: any = record;
        if (typeof data === "object" && "data" in data) data = data.data;

        let name;
        if (record instanceof RecordSchema && record.getRepresentation) name = record.getRepresentation();
        else if (typeof data === "string") name = gameLocalization.getText({ localeId: [`${data} Name`, data] });
        else {
            name = gameLocalization.getObjectLocalization({ instance: data });
        }

        const resultObject: ISelectItem = {
            id,
            label: name ?? id,
        };

        if (typeof record === "object") resultObject["record"] = record;
        result.push(resultObject);
    }

    return result;
});

const filteredItems = computed(() => {
    if (!searchQuery.value.trim()) {
        return items.value;
    }

    const query = searchQuery.value.toLowerCase().trim();
    return items.value.filter(
        (item) => item.label.toLowerCase().includes(query) || item.id.toString().toLowerCase().includes(query)
    );
});

const selectedItemLabel = computed(() => {
    if (!props.modelValue) return null;
    const found = items.value.find((item) => item.id === props.modelValue);
    return found ? found.label : null;
});

function handleSearch() {
    selectedIndex.value = -1;
    isOpen.value = true;
}

function selectItem(item: ISelectItem) {
    let resultValue = String(item.id);
    if (props.fieldContext?.field.onOptionChange) {
        const res = props.fieldContext?.field.onOptionChange(props.fieldContext, item);
        if (res !== undefined) {
            resultValue = res;
        }
    }
    emit("update:modelValue", resultValue);
    searchQuery.value = item.label;
    isOpen.value = false;
    selectedIndex.value = -1;
}

function clearSelection() {
    emit("update:modelValue", null);
    searchQuery.value = "";
    isOpen.value = false;
    selectedIndex.value = -1;
    nextTick(() => {
        searchInput.value?.focus();
    });
}

function closeDropdown() {
    isOpen.value = false;
    selectedIndex.value = -1;
    if (items.value) {
        const found = items.value.find((item) => item.id === props.modelValue);
        searchQuery.value = found ? found.label : "";
    } else {
        searchQuery.value = "";
    }
}

function selectNext() {
    if (filteredItems.value.length === 0) return;
    selectedIndex.value = (selectedIndex.value + 1) % filteredItems.value.length;
}

function selectPrev() {
    if (filteredItems.value.length === 0) return;
    selectedIndex.value = selectedIndex.value <= 0 ? filteredItems.value.length - 1 : selectedIndex.value - 1;
}

function selectCurrent() {
    if (selectedIndex.value >= 0 && selectedIndex.value < filteredItems.value.length) {
        selectItem(filteredItems.value[selectedIndex.value]);
    }
}

function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".item-select")) {
        closeDropdown();
    }
}

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
});

watch(
    () => props.modelValue,
    (newVal) => {
        if (newVal) {
            const found = items.value.find((item) => item.id === newVal);
            if (found) {
                searchQuery.value = found.label;
            }
        } else {
            searchQuery.value = "";
        }
    },
    { immediate: true }
);
</script>

<style scoped>
.item-select {
    position: relative;
    width: 100%;
}

.item-select__search {
    position: relative;
    display: flex;
    align-items: center;
}

.item-select__input {
    width: 100%;
    padding: 8px 32px 8px 12px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    font-size: 14px;
    color: #e0e0e0;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.item-select__input:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.item-select__input::placeholder {
    color: #777;
}

.item-select__clear {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 6px;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.item-select__clear:hover {
    color: #fff;
    background: #4a4a4a;
}

.item-select__dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 250px;
    overflow-y: auto;
    background: #2a2a2a;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    margin-top: 4px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.item-select__option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s;
    gap: 12px;
}

.item-select__option:hover,
.item-select__option.active {
    background: #3d3d3d;
}

.item-select__option-name {
    font-size: 14px;
    color: #e0e0e0;
    flex: 1;
}

.item-select__option-id {
    font-size: 12px;
    color: #888;
    font-family: monospace;
    flex-shrink: 0;
}

.item-select__empty {
    padding: 12px;
    text-align: center;
    color: #666;
    font-size: 14px;
    background: #2a2a2a;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    margin-top: 4px;
}

.item-select__selected {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #2a2a2a;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    gap: 12px;
}

.item-select__selected-name {
    font-size: 14px;
    color: #e0e0e0;
    flex: 1;
}

.item-select__selected-id {
    font-size: 12px;
    color: #888;
    font-family: monospace;
    flex-shrink: 0;
}

.item-select__dropdown::-webkit-scrollbar {
    width: 6px;
}

.item-select__dropdown::-webkit-scrollbar-track {
    background: #2a2a2a;
}

.item-select__dropdown::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 3px;
}

.item-select__dropdown::-webkit-scrollbar-thumb:hover {
    background: #666;
}
</style>
