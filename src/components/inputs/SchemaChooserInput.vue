<!-- src/components/inputs/SchemaChooserInput.vue -->
<template>
  <div class="schema-chooser">
    <OptionsInput
      v-model="selectedSchema"
      :field="schemaField"
      :data="recordData"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { isObjectNotArray, Field, type RecordSchema } from "@/types/fields/fields";
import { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";
import { gameLocalization } from "@/types/localization";
import OptionsInput from "./OptionsInput.vue";

const props = defineProps<{
  recordData: RecordSchema
}>();

const emit = defineEmits<{
  (e: "schemaСhoose", value: RecordSchema): void;
}>();

const schemas = computed(() => {
  return (props.recordData.schemaChooser as typeof SchemaChoicer).schemas || [];
});

const selectedSchema = computed(() => {
  const currentSchema = props.recordData.choosedSchema;
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
      if (!isObjectNotArray(props.recordData)) return;
      const choosedSchema = schemas.value.find(s => s.name === name);
      if (choosedSchema) {
        emit("schemaСhoose", props.recordData.castToNewSchema(
          choosedSchema.schema,
          {
            schemaChooser: props.recordData.schemaChooser,
            choosedSchema: choosedSchema,
          }
        ));
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
