<!-- src/components/inputs/SchemaChooserInput.vue -->
<template>
    <div class="schema-chooser">
        <OptionsInput v-model="selectedSchema" :field="schemaField" :data="recordSchema.getData()" />
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { isObjectNotArray, Field, type RecordSchema } from "@/types/fields/fields";
import { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";
import OptionsInput from "./OptionsInput.vue";

const props = defineProps<{
    recordSchema: RecordSchema;
}>();

const emit = defineEmits<{
    (e: "schemaСhoose", value: RecordSchema): void;
}>();

const schemas = computed(() => {
    return (props.recordSchema.schemaChooser as typeof SchemaChoicer).schemas || [];
});

const selectedSchema = computed(() => {
    const currentSchema = props.recordSchema.choosedSchema;
    return currentSchema ? currentSchema.name : "";
});

const schemaField = computed(() => {
    const options: Record<string, string> = {};
    for (const schema of schemas.value) {
        options[schema.name] = schema.name;
    }
    return Field.create({
        key: "schema",
        label: "Тип схемы",
        type: "select",
        options,
        editable: true,
        onChange: (_data: any, event: Event) => {
            const target = event.target as HTMLSelectElement;
            const name = target.value;
            if (!isObjectNotArray(props.recordSchema)) return;
            const choosedSchema = schemas.value.find((s) => s.name === name);
            if (choosedSchema) {
                emit(
                    "schemaСhoose",
					props.recordSchema.castToNewSchema(choosedSchema.schema, {
					    parent: props.recordSchema.parent,
					    name: props.recordSchema.name,
					    lastSchemaParent: props.recordSchema.lastSchemaParent,
                        schemaChooser: props.recordSchema.schemaChooser,
                        choosedSchema: choosedSchema,
                    })
                );
            }
        },
    });
});
</script>

<style scoped>
.schema-chooser {
    width: 100%;
}
</style>
