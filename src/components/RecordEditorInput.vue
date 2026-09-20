// src/components/RecordEditorInput.vue

<template>
    <div class="form-frame">
        <div v-if="title" class="form-frame__title">
            <h3>{{ title }}</h3>
        </div>

        <div class="form-frame__fields">
            <div class="toolbar">
                <div class="toolbar-buttons" v-if="!notHasDeleteAndCopyButtons">
                    <button
                        v-if="(frameNavigator?.getPathStack()?.length ?? 0) === 0"
                        class="toolbar-btn toolbar-btn--danger"
                        @click="deleteCurrentTab()"
                    >
                        🗑 {{uitext('delete')}}
                    </button>
                    <button
                        v-if="(frameNavigator?.getPathStack()?.length ?? 0) === 0"
                        class="toolbar-btn toolbar-btn--primary"
                        @click="copyCurrentTab()"
                    >
                        📋 {{uitext('copy')}}
                    </button>
                </div>

                <div class="toolbar-checkbox" v-if="isShowUnneccesaryFieldsCheckmark">
                    <label for="ShowUnneccesaryFields">{{uitext('showUnneccesaryFields')}}</label>
                    <input v-model="isShowUnneccesaryFields" id="ShowUnneccesaryFields" type="checkbox" />
                </div>

                <div class="toolbar-search">
                    <input
                        type="text"
                        v-model="fieldSearchQuery"
                        :placeholder="`${uitext('fieldSearch')}...`"
                        class="field-search-input"
                    />
                </div>
            </div>

            <div v-if="dataRef.schemaChooser" class="form-frame__chooser">
                <label>Тип схемы:</label>
                <SchemaChooserInput :record-schema="dataRef" @schemaСhoose="handleSchemaChoose" />
            </div>

            <div v-if="customRenderComponent" class="form-frame__custom-render">
                <component
                    :is="customRenderComponent"
                    :record-schema="dataRef"
                    :navigate="handleNavigate"
                    :list-tabs="props.listTabs"
                    :validation-errors="validationErrors"
                />
            </div>

            <div
                v-for="field in filteredDisplayFields"
                :key="field.key || field.label"
                class="form-field"
                :class="{ 'field-hidden': field.hidden || (field.unneccesary && !isShowUnneccesaryFields) }"
            >
                <div class="form-field__header">
                    <label :for="field.key">{{
                        gameLocalization.getUIText({
                            localeId: field.key !== "" ? [field.key, field.label] : field.label,
                            default: field.label,
                        }) +
                        (!dataRef.has(field) && !field.virtual
                            ? ` (${gameLocalization.getUIText({
                                  localeId: "notInitialized",
                              })})`
                            : "")
                    }}</label>
                </div>

                <!-- <template v-for="vnode in getFieldVnodes(field)">
                    <VNodeRenderer :vnode="vnode" />
                </template> -->

                <template v-for="(vnode, index) in getFieldVnodes(field)" :key="`${field.key}-${index}`">
                    <VNodeRenderer :vnode="vnode" :on-ref="handleRef" :field-key="field.key" />
                </template>

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
import {
    inject,
    ref,
    watch,
    computed,
    triggerRef,
    toValue,
    nextTick,
    defineComponent,
    type Component,
    cloneVNode,
} from "vue";
import { copyRecordSchema } from "@/utils/copyUtils";
import SchemaChooserInput from "@/components/inputs/SchemaChooserInput.vue";
import { RecordSchema, Field } from "@/types/fields/fields";
import { gameLocalization, uitext } from "@/types/localization";
import { Navigator, isNavigable } from "@/utils/navigation";
import { Tab } from "@/types/tabs";
import ListTabs from "./ListTabs.vue";
import { useDataStore } from "@/stores/dataStore";
import { currentProjectTag } from "@/consts/ProjectConsts";
import { fieldRender, extraFieldRender } from "@/types/fields/fieldsRender";

const props = defineProps<{
    data: any;
    listTabs?: InstanceType<typeof ListTabs>;
    title?: string;
    validate?: boolean;
    notHasDeleteAndCopyButtons?: boolean;
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
		console.log("dataRef", props.data.getFields())
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
    return dataRef.value.getData();
});

const fieldSearchQuery = ref("");

const filteredDisplayFields = computed(() => {
    let res = displayFields.value.filter((field) => !(field.key === "compareMethod" && hasCompareInput));

    if (!fieldSearchQuery.value.trim()) {
        return res;
    }
    const query = fieldSearchQuery.value.toLowerCase().trim();
    return res.filter((field) => {
        const localizedName = gameLocalization.getUIText({
            localeId: field.key !== "" ? [field.key, field.label] : field.label,
            default: field.label,
        });
        const label = (field.label || "").toLowerCase();
        const key = (field.key || "").toLowerCase();
        return label.includes(query) || key.includes(query) || localizedName.toLowerCase().includes(query);
    });
});

const isShowUnneccesaryFields = ref<boolean>(false);
const isShowUnneccesaryFieldsCheckmark = computed<boolean>(() => {
    return displayFields.value.some((el) => el.unneccesary);
});

const hasCompareInput = computed<boolean>(() => {
    return toValue(dataRef as any)?.getFieldByKey("compareMethod") && toValue(dataRef as any)?.getFieldByKey("value");
});

function handleNavigate(key: any, compIn: Map<string, any>) {
    fieldSearchQuery.value = "";
    return !!frameNavigator?.navigate?.(key, compIn ?? componentInstances);
}

function handleSchemaChoose(newInstance: RecordSchema) {
    frameNavigator?.changeCurrentSchema(newInstance);
    triggerRef(dataRef);
}

const componentInstances = new Map<string, any>();
function handleRef(el: any, fieldKey: string) {
    if (el) {
        componentInstances.set(fieldKey, el);
    } else {
        componentInstances.delete(fieldKey);
    }
}

const VNodeRenderer = defineComponent({
    props: ["vnode", "onRef", "fieldKey"],
    render() {
        const vnode = this.vnode;
        if (!vnode) return null;
        if (this.onRef && this.fieldKey) {
            return cloneVNode(vnode, {
                ref: (el: any) => (this.onRef as any)(el, this.fieldKey),
            });
        }
        return vnode;
    },
});

const vnodes = computed(() => {
    const res: Map<string, Array<Component | undefined>> = new Map();
    for (const field of filteredDisplayFields.value) {
        const extra = extraFieldRender({ recordSchema: dataRef.value, field });
        const main = fieldRender({
            recordSchema: dataRef.value,
            field,
            handleNavigate,
            extraProps: frameNavigator?.getLastPathItem()?.lastSavedData?.get(field.key),
        });
        res.set(field.key, [extra, main]);
    }

    return res;
});

function getFieldVnodes(field: Field) {
    return vnodes.value.get(field.key);
}

function getCurrentTab() {
    return frameNavigator?.tab;
}

function copyCurrentTab() {
    const currentTab: Tab | undefined = getCurrentTab();
    if (currentTab && currentTab.schemaType && currentTab.data instanceof RecordSchema && currentTab.dataStoreId) {
        const newInstance = copyRecordSchema(currentTab.data, currentProjectTag);
        const newInstanceId = newInstance.getId();
        if (newInstanceId || dataStore.isArray(currentTab.dataStoreId)) {
            dataStore.addSchema(currentTab.dataStoreId, newInstance, newInstanceId, currentProjectTag);
            const resultId = dataStore.isArray(currentTab.dataStoreId)
                ? dataStore.getArray(currentTab.dataStoreId).length-1
                : newInstanceId
			if (props.listTabs && resultId !== undefined)
                props.listTabs.selectTab(
                    resultId
                );
        }
    }
}

const customRenderComponent = computed<Component | undefined>(() => {
    const schema = dataRef.value;
    if (!schema) return undefined;
    const fn = (schema as any).getRenderComponent;
    if (typeof fn !== "function") return undefined;
    return fn.call(schema);
});

function deleteCurrentTab() {
    const current = getCurrentTab();
    if (current?.dataStoreId) {
        if (dataStore.isArray(current.dataStoreId)) {
            if (typeof current?.id === "number") {
                const data = dataStore.getArray(current.dataStoreId);
                data.splice(current?.id, 1);
                if (props.listTabs) props.listTabs.closeTab();
            }
        } else {
            const data = dataStore.getMap(current.dataStoreId);
            data.delete(current?.id);
            if (props.listTabs) props.listTabs.closeTab();
        }
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
			console.log("marked", id)
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
    display: inline-block;
    padding: 8px 16px;
    background: #2d2d3d;
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    font-size: 13px;
    color: #66d9a0;
    font-family: "Consolas", "Monaco", monospace;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.object-summary:hover {
    background: #3a3a4a;
    border-color: #66d9a0;
    box-shadow: 0 0 0 2px rgba(102, 217, 160, 0.2), 0 4px 8px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
}

.object-summary:active {
    transform: translateY(0px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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
    background: #007fff;
}
.toolbar-btn--primary:hover {
    background: #0056b3;
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

/* В <style scoped> — добавить в конец, либо рядом с .form-field input */

/* ===== Кастомный рендер из RecordSchema.getRenderComponent() ===== */
.form-frame__custom-render {
    margin-bottom: 16px;
}

.form-frame__custom-render :deep(input),
.form-frame__custom-render :deep(textarea),
.form-frame__custom-render :deep(select) {
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

.form-frame__custom-render :deep(input:focus),
.form-frame__custom-render :deep(textarea:focus),
.form-frame__custom-render :deep(select:focus) {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.form-frame__custom-render :deep(input::placeholder),
.form-frame__custom-render :deep(textarea::placeholder) {
    color: #777;
}

.form-frame__custom-render :deep(input[type="checkbox"]) {
    width: 18px;
    height: 18px;
    margin-top: 4px;
    accent-color: #42b883;
    cursor: pointer;
}

/* Чтобы вложенные .form-field получали те же отступы и заголовки, что и поля по умолчанию */
.form-frame__custom-render :deep(.form-field) {
    margin-bottom: 16px;
}

.form-frame__custom-render :deep(.form-field__header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.form-frame__custom-render :deep(.form-field label) {
    font-weight: 500;
    font-size: 14px;
    color: #b0b0b0;
}

.form-frame__custom-render :deep(.field-description) {
    font-size: 12px;
    color: #888;
    margin-top: 4px;
    line-height: 1.3;
}

.form-frame__custom-render :deep(.field-error) {
    color: #ff6b6b;
    font-size: 12px;
    margin-top: 4px;
}


</style>
