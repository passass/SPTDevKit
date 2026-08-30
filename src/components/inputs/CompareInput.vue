<!-- src/components/inputs/CompareInput.vue -->

<template>
	<div class="compare-input">
		<div class="compare-input__row">
			<select
				v-model="items['compareMethod']"
				class="compare-input__select"
			>
				<option value=">=">>=</option>
				<option value="<="><=</option>
				<option value="==">==</option>
				<option value=">">></option>
				<option value="<"><</option>
			</select>

			<input
				type="number"
				v-model.number="items['value']"
				class="compare-input__input"
				placeholder="Значение"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { RecordSchema, type SchemaData } from '@/types/fields/fields';
import { onMounted, computed } from 'vue';


const props = defineProps<{
	modelValue: Record<string, any>;
}>();

const items = computed<SchemaData>(() => {
	const data = props.modelValue instanceof RecordSchema ? props.modelValue.data : props.modelValue
	props.modelValue["compareMethod"] ??= ">="
	props.modelValue["value"] ??= 0
	return data
});
</script>

<style scoped>
.compare-input__row {
	display: flex;
	gap: 8px;
	align-items: center;
}

.compare-input__select {
	padding: 6px 10px;
	background: #333333;
	border: 1px solid #4a4a4a;
	border-radius: 4px;
	color: #e0e0e0;
	font-size: 13px;
	cursor: pointer;
	min-width: 60px;
}

.compare-input__select:focus {
	outline: none;
	border-color: #42b883;
}

.compare-input__input {
	flex: 1;
	padding: 6px 10px;
	background: #333333;
	border: 1px solid #4a4a4a;
	border-radius: 4px;
	color: #e0e0e0;
	font-size: 14px;
	min-width: 80px;
}

.compare-input__input:focus {
	outline: none;
	border-color: #42b883;
}
</style>
