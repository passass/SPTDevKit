<!-- src/components/inputs/CompareInput.vue -->

<template>
	<div class="compare-input">
		<div class="compare-input__row">
			<select
				v-model="localData.compareMethod"
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
				v-model.number="localData.value"
				class="compare-input__input"
				placeholder="Значение"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	modelValue: { compareMethod: string; value: number } | null | undefined;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: { compareMethod: string; value: number }): void;
}>();

const localData = computed({
	get: () => {
		if (!props.modelValue || typeof props.modelValue !== 'object') {
			return { compareMethod: '>=', value: 0 };
		}
		return {
			compareMethod: props.modelValue.compareMethod || '>=',
			value: props.modelValue.value ?? 0
		};
	},
	set: (val) => {
		emit('update:modelValue', val);
	}
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