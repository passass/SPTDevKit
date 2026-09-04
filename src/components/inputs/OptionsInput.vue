<!-- src/components/inputs/OptionsInput.vue -->
<template>
    <select
        v-model="model"
        :disabled="!field.editable"
        class="options-input"
        @change="field.onChange && field.onChange(props.data, $event)"
    >
        <option v-for="opt in sortedOptions(field.options)" :key="opt.option" :value="opt.option">
            {{ opt.loc }}
        </option>
    </select>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Field, SchemaData } from "@/types/fields/fields";
import { gameLocalization } from "@/types/localization";

const props = defineProps<{
    data: SchemaData;
    field: Field;
    modelValue?: any;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: any): void;
}>();

const model = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
});

function sortedOptions(options: any): Array<{ option: any; loc: string }> {
    const localizations: Array<{ option: any; loc: string }> = [];
    const keys = new Set();
    if (Array.isArray(options)) {
        for (const option of options) {
            if (keys.has(option)) continue;
            keys.add(option);
            localizations.push({
                option: option,
                loc: gameLocalization.getObjectLocalization({
                    instance: option,
                    localeId: [option, `${option} Name`],
                    canBeUI: true,
                }),
            });
        }
    } else {
        for (const [optionKey, optionValue] of Object.entries(options)) {
            if (keys.has(optionKey) || typeof optionKey !== "string") continue;
            keys.add(optionKey);
            localizations.push({
                option: optionValue,
                loc: gameLocalization.getObjectLocalization({
                    instance: optionKey,
                    localeId: [optionKey, `${optionKey} Name`],
                    canBeUI: true,
                }),
            });
        }
    }

    localizations.sort((a, b) => a.loc.localeCompare(b.loc));
    return localizations;
}
</script>

<style scoped>
.options-input {
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
.options-input:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}
.options-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
