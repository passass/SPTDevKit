// src/components/RecordEditorInput.vue

<template>
    <div class="form-frame">
        <div v-if="title" class="form-frame__title">
            <h3>{{ title }}</h3>
        </div>

        <div class="form-frame__fields">
	        <div class="toolbar">
	            <div class="toolbar-buttons">
	                <button
	                    v-if="(frameNavigator?.getPathStack()?.length ?? 0) === 0"
	                    class="toolbar-btn toolbar-btn--danger"
	                    @click="deleteCurrentTab()"
	                >
	                    🗑 удалить
	                </button>
	                <button
	                    v-if="(frameNavigator?.getPathStack()?.length ?? 0) === 0"
	                    class="toolbar-btn toolbar-btn--primary"
	                    @click="copyCurrentTab()"
	                >
	                    📋 копировать
	                </button>
	            </div>

	            <div class="toolbar-checkbox" v-if="isShowUnneccesaryFieldsCheckmark">
	                <label for="ShowUnneccesaryFields">Показывать неважные поля</label>
	                <input v-model="isShowUnneccesaryFields" id="ShowUnneccesaryFields" type="checkbox" />
	            </div>

	            <div class="toolbar-search">
	                <input
	                    type="text"
	                    v-model="fieldSearchQuery"
	                    placeholder="Поиск полей..."
	                    class="field-search-input"
	                />
	                <!-- <span v-if="fieldSearchQuery" class="search-results-info">
	                    {{ filteredDisplayFields.length }} / {{ displayFields.length }}
	                </span> -->
	            </div>
	        </div>

            <div v-if="dataRef.schemaChooser" class="form-frame__chooser">
                <label>Тип схемы:</label>
                <SchemaChooserInput :record-schema="dataRef" @schemaСhoose="handleSchemaChoose" />
            </div>

            <div
                v-for="field in filteredDisplayFields"
                :key="field.key || field.label"
                class="form-field"
                :class="{ 'field-hidden': field.hidden || (field.unneccesary && !isShowUnneccesaryFields) }"
            >
                <div class="form-field__header" v-if="!(compareInputFields.includes(field.key) && hasCompareInput)">
                    <label :for="field.key">{{
                        gameLocalization.getUIText({
                            localeId: field.key !== "" ? [field.key, field.label] : field.label,
                            default: field.label,
                        })
                    }}</label>
                    <button
                        v-if="isNavigable(getData[field.key]) && !isCompareInput(field)"
                        class="navigate-btn"
                        @click="handleNavigate(field.key)"
                        title="Открыть вложенную структуру"
                    >
                        →
                    </button>
                </div>

                <div v-if="field.key === 'items' && field.isArray()">
                    <LoadWeaponBuildInput :field="field" :data="getData" />
                    <div
                        v-if="getData[field.key]?.filter((item: WeaponBuildItem) => !item.parentId).length > 0"
                        class="weapon-build-reward"
                    >
                        <span class="weapon-build-reward__label">Предметы:</span>
                        <span class="weapon-build-reward__value">
                            {{ getRewardDisplay(getData[field.key]) }}
                        </span>
                    </div>
                </div>

                <LocalizationInput
                    v-if="field.type === 'localization'"
                    :data="getData"
                    v-model="getData[field.key]"
                    :field="field"
                />

                <AdvancedSelectInput
                    v-else-if="field.type === 'advancedSelect'"
                    v-model="getData[field.key]"
                    :field="field"
                />

                <CompareInput v-else-if="isCompareInput(field)" :data="getData[field.key]" />

                <ParentInput
                    v-else-if="field.key === 'parentId'"
                    :recordSchema="dataRef"
                    v-model="getData[field.key]"
                />

                <div v-else-if="compareInputFields.includes(field.key) && hasCompareInput">
                    <div v-if="field.key === 'value'">
                        <label :for="field.key">{{
                            gameLocalization.getUIText({
                                localeId: field.key,
                                default: field.label,
                            })
                        }}</label>
                        <CompareInput :data="getData" />
                    </div>
                </div>

                <input
                    v-else-if="field.type === 'text' || field.hidden"
                    :id="field.key"
                    v-model="getData[field.key]"
                    type="text"
                    :placeholder="field.placeholder"
                    :disabled="!field.editable"
                />

                <input
                    v-else-if="field.type === 'number'"
                    :id="field.key"
                    v-model="getData[field.key]"
                    type="number"
                    :placeholder="field.placeholder"
                    :disabled="!field.editable"
                />

                <input
                    v-else-if="field.type === 'boolean'"
                    :id="field.key"
                    v-model="getData[field.key]"
                    type="checkbox"
                    :disabled="!field.editable"
                />

                <textarea
                    v-else-if="field.type === 'textarea'"
                    :id="field.key"
                    v-model="getData[field.key]"
                    rows="3"
                    :placeholder="field.placeholder"
                    :disabled="!field.editable"
                />

                <OptionsInput
                    v-else-if="field.type === 'select'"
                    :data="getData"
                    v-model="getData[field.key]"
                    :field="field"
                />

                <ArrayInput
                    v-else-if="field.isArray()"
                    v-model="getData[field.key]"
                    :field="field"
                    :options="field.options || []"
                    :label-field="field.label || 'label'"
                />

                <div v-else-if="field.type === 'object'" class="object-summary">
                    {{ getObjectSummary(getData[field.key]) }}
                </div>

                <div v-if="field.description" class="field-description">
                    {{ field.description }}
                </div>

                <div v-if="validationErrors[field.key]" class="field-error">
                    {{ validationErrors[field.key] }}
                </div>
            </div>
        </div>

        <div v-if="$slots.actions" class="form-frame__actions">
            <slot name="actions"></slot>
        </div>
    </div>
</template>

<!-- src/components/RecordEditorInput.vue -->

<script setup lang="tsx">
import { inject, ref, watch, computed, shallowRef, triggerRef, markRaw, type Ref, toValue, nextTick } from "vue";

import ArrayInput from "@/components/inputs/ArrayInput.vue";
import LocalizationInput from "@/components/inputs/LocalizationInput.vue";
import SchemaChooserInput from "@/components/inputs/SchemaChooserInput.vue";
import { RecordSchema, Field } from "@/types/fields/fields";
import { gameLocalization } from "@/types/localization";
import { Navigator, isNavigable } from "@/utils/navigation";
import { Tab } from "@/tabs/tabs";
import LoadWeaponBuildInput from "./inputs/LoadWeaponBuildInput.vue";
import AdvancedSelectInput from "./inputs/AdvancedSelectInput.vue";
import CompareInput from "./inputs/CompareInput.vue";
import ParentInput from "./inputs/ParentInput.vue";
import ListTabs from "./ListTabs.vue";
import { WeaponBuildItem } from "@/stores/profileStore";
import { useDataStore } from "@/stores/dataStore";
import { currentProjectTag } from "@/project/Project";
import OptionsInput from "./inputs/OptionsInput.vue";
import { availableLocales, suffixes } from "@/types/localization";
import Quests from "@/project/Quests";

const props = defineProps<{
    data: any;
    listTabs: typeof ListTabs;
    title?: string;
    validate?: boolean;
}>();

const emit = defineEmits<{
    (e: "update", data: any): void;
    (e: "validation", result: { valid: boolean; errors: Record<string, string> }): void;
}>();

const dataStore = useDataStore();
const frameNavigator = inject<Navigator>("frameNavigator");
const validationErrors = ref<Record<string, string>>({});

const dataRef = computed<RecordSchema>(() => {
    if (props.data instanceof RecordSchema) {
        return props.data;
    }
    let data = props.data;
    if ("data" in data) {
        data = data.data;
    }
    return data instanceof RecordSchema ? data : new RecordSchema(data);
});

const displayFields = computed<Field[]>(() => {
    return dataRef.value.getDisplayFields();
});

const getData = computed(() => {
    console.log("fields", dataRef.value.getFields(), dataRef.value.getData());
    return dataRef.value.getData();
});

const fieldSearchQuery = ref("");

const filteredDisplayFields = computed(() => {
    if (!fieldSearchQuery.value.trim()) {
        return displayFields.value;
    }
    const query = fieldSearchQuery.value.toLowerCase().trim();
    return displayFields.value.filter(field => {
        const label = (field.label || "").toLowerCase();
        const key = (field.key || "").toLowerCase();
        return label.includes(query) || key.includes(query);
    });
});

const isShowUnneccesaryFields = ref<boolean>(false);
const isShowUnneccesaryFieldsCheckmark = computed<boolean>(() => {
    return displayFields.value.some((el) => el.unneccesary);
});

const compareInputFields: string[] = ["compareMethod", "value"];
const hasCompareInput = computed<boolean>(() => {
    return toValue(dataRef as any)?.getFieldByKey("compareMethod") && toValue(dataRef as any)?.getFieldByKey("value");
});

function getObjectSummary(value: Record<string, any>): string {
    if (!value) return "{}";
    const keys = value instanceof RecordSchema ? Object.keys(value.data) : Object.keys(value);
    if (keys.length === 0) return "{}";

    // Берем первые 3 ключа и переводим их
    const previewKeys = keys.slice(0, 3);
    const translatedKeys = previewKeys.map((key) => {
        const translated = gameLocalization.getUIText({
            localeId: key,
            default: key,
        });
        return translated;
    });

    const preview = translatedKeys.join(", ");
    return keys.length > 3 ? `{ ${preview}... (${keys.length} полей) }` : `{ ${preview} }`;
}

function handleNavigate(key: string) {
	fieldSearchQuery.value = "";
    frameNavigator?.navigate?.(key);
}

function handleSchemaChoose(newInstance: RecordSchema) {
    frameNavigator?.changeCurrentSchema(newInstance);
    triggerRef(dataRef);
}

function isCompareInput(field: Field): boolean {
    return (
        field.nestedSchema &&
        (field.nestedSchema as any)?.fields?.length === 2 &&
        (field.nestedSchema as any)?.getFieldByKeyStatic("compareMethod") &&
        (field.nestedSchema as any)?.getFieldByKeyStatic("value")
    );
}

function getRewardDisplay(items: WeaponBuildItem[]): string {
    const rootItems = items.filter((item) => !item.parentId);
    if (rootItems.length === 0) return "";

    const grouped: Record<string, { tpl: string; count: number }> = {};
    for (const item of rootItems) {
        const tpl = item._tpl;
        if (!grouped[tpl]) grouped[tpl] = { tpl, count: 0 };
        grouped[tpl].count += item?.upd?.StackObjectsCount ?? 1;
    }

    const parts: string[] = [];
    for (const [tpl, data] of Object.entries(grouped)) {
        const name = gameLocalization.getObjectLocalization({ instance: { _id: tpl } });
        const count = data.count;
        const display = count > 1 ? `${name} x ${count}` : name;
        parts.push(display);
    }
    return parts.join(", ");
}

function getCurrentTab() {
    return frameNavigator?.tab;
}

function copyCurrentTab() {
    const currentTab: Tab | undefined = getCurrentTab();
    if (currentTab && currentTab.schemaType && currentTab.data instanceof RecordSchema) {
        const newInstance = Quests.copyQuest(currentTab.data);
        const newInstanceId = newInstance.getId();
        if (newInstanceId && currentTab.dataStoreId) {
            dataStore.set(currentTab.dataStoreId, newInstanceId, newInstance);
            dataStore.addTag(currentTab.dataStoreId, newInstanceId, currentProjectTag);
            props.listTabs.selectTab(newInstanceId);
        }
    }
}

function deleteCurrentTab() {
    const current = getCurrentTab();
    if (current?.dataStoreId) {
        const data = dataStore.getMap(current.dataStoreId);
        data.delete(current?.id);
        props.listTabs.closeTab();
    }
}

const initialized = ref(false);

watch(
    () => props.data,
    () => {
        initialized.value = false;
        nextTick(() => {
            initialized.value = true;
        });
    },
    { immediate: true }
);

watch(
    () => getData.value,
    () => {
        if (frameNavigator?.tab && initialized.value) {
            const id = frameNavigator.tab.id;
            const storeId = frameNavigator.tab.dataStoreId;
            if (storeId && id) dataStore.markDirty(storeId, id);
        }
    },
    { deep: true }
);
</script>

<style scoped>
.form-frame {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 24px;
    border: 1px solid #3d3d3d;
    color: #e0e0e0;
}

.form-frame__title {
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #3d3d3d;
}

.form-frame__title h3 {
    margin: 0;
    font-size: 18px;
    color: #e8e8e8;
    font-weight: 600;
}

.form-field {
    margin-bottom: 16px;
}

.form-field.field-hidden {
    display: none;
    /* opacity: 0.4; */
}

.form-field__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.form-field label {
    font-weight: 500;
    font-size: 14px;
    color: #b0b0b0;
}

.navigate-btn {
    background: transparent;
    border: 1px solid #4a4a4a;
    color: #42b883;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.navigate-btn:hover {
    background: #42b883;
    color: #1e1e1e;
    border-color: #42b883;
}

.form-field input,
.form-field textarea,
.form-field select {
    width: 100%;
    padding: 8px 12px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    font-size: 14px;
    color: #e0e0e0;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.form-field input::placeholder,
.form-field textarea::placeholder {
    color: #777;
}

.form-field input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 4px;
    accent-color: #42b883;
    cursor: pointer;
}

.object-summary {
    padding: 8px 12px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 6px;
    font-size: 13px;
    color: #999;
    font-family: "Consolas", "Monaco", monospace;
    cursor: default;
    user-select: none;
}

.field-description {
    font-size: 12px;
    color: #888;
    margin-top: 4px;
    line-height: 1.3;
}

.field-error {
    color: #ff6b6b;
    font-size: 12px;
    margin-top: 4px;
}

.form-frame__actions {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #3d3d3d;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.weapon-build-reward {
    margin: 8px 0;
    padding: 6px 12px;
    background: rgba(66, 184, 131, 0.08);
    border-left: 3px solid #42b883;
    border-radius: 4px;
    display: flex;
    gap: 8px;
    font-size: 13px;
    color: #b0b0b0;
}

.weapon-build-reward__label {
    font-weight: 500;
    color: #42b883;
    flex-shrink: 0;
}

.weapon-build-reward__value {
    color: #e0e0e0;
    word-break: break-word;
}

.search-field {
    margin-bottom: 12px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border: 1px solid #3d3d3d;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.field-search-input {
    flex: 1;
    padding: 6px 10px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    min-width: 150px;
}

.field-search-input:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.search-results-info {
    font-size: 12px;
    color: #888;
    white-space: nowrap;
}

.toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
    padding: 4px 0;
}

.toolbar-buttons {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}

.toolbar-btn {
    padding: 4px 12px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #fff;
    font-weight: 500;
    white-space: nowrap;
}

.toolbar-btn--danger {
    background: #e74c3c;
}
.toolbar-btn--danger:hover {
    background: #c0392b;
}

.toolbar-btn--primary {
    background: #007FFF;
}
.toolbar-btn--primary:hover {
    background: #0056B3;
}

.toolbar-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    font-size: 13px;
    color: #b0b0b0;
}

.toolbar-checkbox input[type="checkbox"] {
    appearance: none;
    width: 18px;
    height: 18px;
    background: #333333;
    border: 2px solid #4a4a4a;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 0;
    position: relative;
}

.toolbar-checkbox input[type="checkbox"]:checked {
    background: #42b883;
    border-color: #42b883;
}

.toolbar-checkbox input[type="checkbox"]:checked::after {
    content: "✓";
    color: #1a1a1a;
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.toolbar-checkbox input[type="checkbox"]:hover {
    border-color: #66d9a0;
}

.toolbar-checkbox input[type="checkbox"]:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}

.toolbar-search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 200px;
    min-width: 150px;
}

.field-search-input {
    flex: 1;
    padding: 4px 8px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    color: #e0e0e0;
    font-size: 13px;
    min-width: 80px;
}

.field-search-input:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.search-results-info {
    font-size: 12px;
    color: #888;
    white-space: nowrap;
}
</style>
