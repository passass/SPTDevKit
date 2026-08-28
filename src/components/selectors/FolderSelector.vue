<template>
	<div>
		<button
			class="select-folder-btn"
			:class="[`select-folder-btn--${variant}`]"
			@click="handleSelect"
			:disabled="loading"
		>
			<span class="btn-icon">{{ icon }}</span>
			{{ loading ? "Загрузка..." : label }}
		</button>

		<div class="selected-path" :class="[`selected-path--${variant}`]">
			{{ pathIcon }} {{ modelValue }}
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	modelValue?: string;
	loading?: boolean;
	label: string;
	icon?: string;
	pathIcon?: string;
	variant?: 'project' | 'eft';
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void;
	(e: 'select'): void;
}>();

function handleSelect() {
	emit('select');
}
</script>

<style scoped>
.select-folder-btn {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 12px 28px;
	background: #42b883;
	border: none;
	border-radius: 8px;
	color: #1a1a1a;
	font-size: 16px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.25s ease;
	box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.select-folder-btn:hover:not(:disabled) {
	background: #66d9a0;
	transform: translateY(-2px);
	box-shadow: 0 4px 16px rgba(66, 184, 131, 0.4);
}

.select-folder-btn:active:not(:disabled) {
	transform: translateY(0);
	box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.select-folder-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
}

.select-folder-btn--eft {
	background: #4a6fa5;
	box-shadow: 0 2px 8px rgba(74, 111, 165, 0.3);
	margin-top: 12px;
}

.select-folder-btn--eft:hover:not(:disabled) {
	background: #6b8fc9;
	box-shadow: 0 4px 16px rgba(74, 111, 165, 0.4);
}

.btn-icon {
	font-size: 20px;
}

.selected-path {
	margin-top: 16px;
	padding: 12px 16px;
	background: #2a2a2a;
	border: 1px solid #3d3d3d;
	border-radius: 6px;
	font-size: 14px;
	color: #b0b0b0;
	word-break: break-all;
}

.selected-path--eft {
	border-color: #4a6fa5;
	color: #8bb3e0;
}
</style>