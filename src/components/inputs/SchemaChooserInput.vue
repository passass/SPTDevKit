<!-- src/components/inputs/SchemaChooserInput.vue -->

<template>
	<div class="schema-chooser">
		<select
			:value="selectedSchema"
			@change="handleChange"
			class="schema-chooser__select"
		>
			<option
				v-for="schema in sortedSchemas"
				:key="schema.name"
				:value="schema.name"
			>
				{{ getTranslatedName(schema.name) }}
			</option>
		</select>
	</div>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Ref } from "vue";
import { isObjectNotArray, type RecordSchema } from "@/types/fields/fields";
import { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";
import { gameLocalization } from "@/types/localization";
import { type locales } from "@/types/localization";

const props = defineProps<{
	recordData: RecordSchema
}>();

const emit = defineEmits<{
	(e: "schemaСhoose", value: RecordSchema): void;
}>();

const schemas = computed(() => {
	return (props.recordData.schemaChooser as typeof SchemaChoicer).schemas || [];
});

const translatedNames = computed(() => {
	const map = new Map<string, string>();
	for (const schema of schemas.value) {
		const translated = gameLocalization.getUIText({
			localeId: schema.name,
		});
		map.set(schema.name, translated);
	}
	return map;
});

const sortedSchemas = computed(() => {
	return [...schemas.value].sort((a, b) => {
		const nameA = translatedNames.value.get(a.name) || a.name;
		const nameB = translatedNames.value.get(b.name) || b.name;
		return nameA.localeCompare(nameB);
	});
});

function getTranslatedName(name: string): string {
	return translatedNames.value.get(name) || name;
}

const selectedSchema = computed({
	get: () => {
		const currentSchema = props.recordData.choosedSchema;
		if (currentSchema) {
			return currentSchema.name;
		}
		return "";
	},
	set: (name: string) => {
		if (!isObjectNotArray(props.recordData)) return;
		const choosedSchema = schemas.value.find(s => s.name === name);
		if (choosedSchema) {
			emit("schemaСhoose", props.recordData.castToNewSchema(
				choosedSchema.schema
				, {
					schemaChooser: props.recordData.schemaChooser,
					choosedSchema: choosedSchema,
				}
			));
		}
	}
});

function handleChange(event: Event) {
	const target = event.target as HTMLSelectElement;
	selectedSchema.value = target.value;
}
</script>

<style scoped>
.schema-chooser__select {
	width: 100%;
	padding: 8px 12px;
	background: #333333;
	border: 1px solid #4a4a4a;
	border-radius: 6px;
	font-size: 14px;
	color: #e0e0e0;
	transition: border-color 0.2s, box-shadow 0.2s;
	box-sizing: border-box;
	cursor: pointer;
}

.schema-chooser__select:focus {
	outline: none;
	border-color: #42b883;
	box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.schema-chooser__select option {
	background: #333333;
	color: #e0e0e0;
}
</style>