// src/components/RecordEditorInput.vue

<template>
	<div class="form-frame">
		<div v-if="title" class="form-frame__title">
			<h3>{{ title }}</h3>
		</div>

		<div class="form-frame__fields">
			<button v-if="(frameNavigator?.getPathStack()?.length ?? 0) === 0">
				удалить
			</button>

			<div class="form-field" v-if="isShowUnneccesaryFieldsCheckmark">
				<label :for="'ShowUnneccesaryFields'">Показывать неважные поля</label>
				<input
					v-model="isShowUnneccesaryFields"
					:id="'ShowUnneccesaryFields'"
					type="checkbox"
				/>
			</div>

			<div v-if="recordData.schemaChooser" class="form-frame__chooser">
				<label>Тип схемы:</label>
				<SchemaChooserInput
					:record-data="recordData"
					@schemaСhoose="handleSchemaChoose"
				/>
			</div>
			
			<div
				v-for="field in displayFields"
				:key="field.key"
				class="form-field"
				:class="{ 'field-hidden': field instanceof HiddenField || (field instanceof UnneccesaryField && !isShowUnneccesaryFields) }"
			>
				<div class="form-field__header">
					<label :for="field.key">{{ field.label }}</label>
					<button
						v-if="isNavigable(getData[field.key])"
						class="navigate-btn"
						@click="handleNavigate(field.key)"
						title="Открыть вложенную структуру"
					>
						→
					</button>
				</div>

				<LocalizationInput
					v-if="field.type === 'localization'"
					v-model="getData[field.key]"
					:field="field"
				/>

				<AdvancedSelectInput
					v-if="field.type === 'itemChoice'"
					v-model="getData[field.key]"
					:field="field"
				/>

				<input
					v-else-if="field.type === 'text' || field instanceof HiddenField"
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

				<select
					v-else-if="field.type === 'select'"
					:id="field.key"
					v-model="getData[field.key]"
					:disabled="!field.editable"
				>
					<option
						v-for="option in field.options"
						:key="option"
						:value="option"
					>
						{{ gameLocalization.getText({
							localeId: [
								option,
								`${option} Name`,
								`${option} Nickname`
							]
						, locale: currentLocale}) }}
					</option>
				</select>

				<ArrayInput
					v-else-if="field.type === 'array' || field.type === 'stringArray' || field.type === 'arrayItemChoice'"
					v-model="getData[field.key]"
					:field="field"
					:array-key="field.key"
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

// src/components/RecordEditorInput.vue

<script setup lang="tsx">
import { inject, ref, watch, computed, shallowRef, triggerRef, markRaw, type Ref } from "vue";
import { 
	RecordSchema,
	Field,
	UnneccesaryField,
	HiddenField
} from "@/types/fields/fields";
import AdvancedSelectInput from "./inputs/AdvancedSelectInput.vue";
import LocalizationInput from "@/components/inputs/LocalizationInput.vue";
import ArrayInput from "@/components/inputs/ArrayInput.vue";
import { Navigator, isNavigable } from "@/utils/navigation.ts";
import SchemaChooserInput from "@/components/inputs/SchemaChooserInput.vue";
import { gameLocalization } from "@/types/localization.ts";
import { type locales } from "@/types/localization.ts";

const currentLocale: Ref<locales> = inject<Ref<locales>>("currentLocale") ?? ref('en')

const props = defineProps<{
	data: any;
	title?: string;
	validate?: boolean;
}>();

const emit = defineEmits<{
	(e: "update", data: any): void;
	(e: "validation", result: { valid: boolean; errors: Record<string, string> }): void;
}>();

const frameNavigator = inject<Navigator>("frameNavigator");
const validationErrors = ref<Record<string, string>>({});

const dataRef = computed<RecordSchema>(() => {
	return props.data instanceof RecordSchema ? props.data : new RecordSchema(props.data)
});

const displayFields = computed<Field[]>(() => {
	return dataRef.value.getDisplayFields();
});

const recordData = computed(() => dataRef.value);
const getData = computed(() => recordData.value.getData());
const isShowUnneccesaryFields = ref<boolean>(false);
const isShowUnneccesaryFieldsCheckmark = computed<boolean>(() => {
	return displayFields.value.some((el) => el instanceof UnneccesaryField)
})

function getObjectSummary(value: Record<string, any>): string {
	if (!value) return "{}";
	const keys = Object.keys(value);
	if (keys.length === 0) return "{}";
	const preview = keys.slice(0, 3).join(", ");
	return keys.length > 3
		? `{ ${preview}... (${keys.length} полей) }`
		: `{ ${preview} }`;
}

function handleNavigate(key: string) {
	frameNavigator?.navigate?.(key);
}

function handleSchemaChoose(newInstance: RecordSchema) {
	frameNavigator?.changeCurrentSchema(newInstance);
	triggerRef(dataRef);
}
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
</style>