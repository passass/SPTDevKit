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

			<span class="array-input__counter">
				{{ displayIndex }} / {{ items.length }}
			</span>

			<button
				type="button"
				class="array-input__nav-btn"
				@click="nextItem"
				:disabled="selectedIndex === null || selectedIndex >= items.length - 1"
				title="Следующий"
			>
				▶
			</button>

			<button
				type="button"
				class="array-input__btn"
				@click="addItem"
				title="Добавить элемент"
			>
				+
			</button>
		</div>

		<!-- Режим строкового массива: текстовое поле -->
		<div v-if="isStringArray" class="array-input__editor">
			<template v-if="selectedIndex !== null">
				<AdvancedSelectInput 
					v-if="field.type === 'arrayItemChoice'"
					v-model="items[selectedIndex]"
					:field="field"
				/>
				<input
					v-else
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
			<div v-else class="array-input__empty">
				Нет элементов
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { RecordSchema, Field, ItemField } from "@/types/fields/fields";
import AdvancedSelectInput from "./AdvancedSelectInput.vue";
import { SchemaChoicer, type SchemaChoice } from "@/types/fields/fieldsSchemaChoicer.ts";
import { getStaticField, type ClassType } from "@/utils/classUtils.ts";
import { Navigator } from "@/utils/navigation.ts";

type InputType = any[]
const frameNavigator = inject<Navigator>("frameNavigator");

const props = defineProps<{
	modelValue: InputType;
	field: Field;
	arrayKey: string;
	labelField?: string;
}>();


const emit = defineEmits<{
	(e: "update:modelValue", value: InputType): void;
	(e: "change", value: InputType): void;
}>();

const selectedIndex = ref<number | null>(
	props.modelValue.length > 0 ? 0 : null,
);

const items = computed({
	get: () => props.modelValue as InputType,
	set: (val: InputType) => {
		emit("update:modelValue", val);
		emit("change", val);
	},
});

// Определяем, является ли массив массивом строк
const isStringArray = computed(() => {
	if (items.value.length === 0) return false;
	return ( 
		props.field.type === "itemChoice"
		|| props.field.type === "stringArray"
		|| (
			Array.isArray(items.value) 
			&& items.value.every(item => typeof item === 'string')
		)
	);
});

const selectedItem = computed(() => {
	if (
		selectedIndex.value === null ||
		selectedIndex.value >= items.value.length
	) {
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

function addItem() {
	if (isStringArray.value) {
		items.value.push("")
		selectedIndex.value = items.value.length - 1;
	} else {
		const arrayItemSchema = props.field.arrayItemSchema
		if (arrayItemSchema) {
			if (SchemaChoicer.isPrototypeOf(arrayItemSchema)) {
				const choosedSchema = getStaticField<SchemaChoice[]>(arrayItemSchema, 'schemas')?.[0]
				
				if (choosedSchema) {
					items.value.push(new choosedSchema.schema({}, {
						schemaChooser: props.field.arrayItemSchema,
						choosedSchema: choosedSchema,
					}))

					frameNavigator?.navigate([props.arrayKey, items.value.length-1])
					return
				}
			}
		}

		const nestedSchema: Field["nestedSchema"] = props.field.nestedSchema
		if (nestedSchema) {
			items.value.push(new nestedSchema({}))
			frameNavigator?.navigate([props.arrayKey, items.value.length-1])
		}
	}
}

function updateStringItem(event: Event) {
	const value = (event.target as HTMLInputElement).value;
	if (selectedIndex.value === null) return;
	items.value[selectedIndex.value] = value;
}

function handleNavigate() {
	if (selectedIndex.value === null) return;
	frameNavigator?.navigate?.([props.arrayKey, selectedIndex.value]);
}

watch(
	() => props.modelValue,
	(newVal) => {
		if (!Array.isArray(newVal)) return;
		if (newVal.length === 0) {
			selectedIndex.value = null;
			return;
		}
		if (
			selectedIndex.value === null ||
			selectedIndex.value >= newVal.length
		) {
			selectedIndex.value = 0;
		}
	},
	{ immediate: true, deep: true },
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
</style>