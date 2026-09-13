<template>
	<AdvancedSelectInput
	    v-model="props.modelValue"
		:itemsOverride="items"
	/>
</template>

<script setup lang="ts">
import AdvancedSelectInput from './AdvancedSelectInput.vue';
import { computed } from 'vue';
import { Field, getIdFieldValue, RecordSchema } from '@/types/fields/fields';
const props = defineProps<{
	modelValue: string | null;
	recordSchema: RecordSchema;
}>();

const items = computed(() => {
	const result: Map<string, Record<string, any>> = new Map()

	if (Array.isArray(props.recordSchema.parent)) {
		for (const el of props.recordSchema.parent) {
			const id = getIdFieldValue(el)
			if ("_tpl" in el && id) {
				result.set(id, {"id": el["_tpl"]})
			}
		}
	}

	return result
})

</script>
