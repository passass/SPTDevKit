<!-- src/components/inputs/LoadWeaponBuildInput.vue -->
<template>
    <div class="weapon-build-wrapper">
        <div class="weapon-build-label">
            <span class="label-icon">🛠️</span>
            <span>{{gameLocalization.getUIText({localeId: "choiceWeaponBuild"})}}</span>
        </div>
        <div class="weapon-build-controls">
            <div class="select-wrapper">
                <select ref="selectRef" class="weapon-build-select">
                    <option value="" disabled selected>{{gameLocalization.getUIText({localeId: "choiceWeaponBuild"})}}...</option>
                    <option v-for="build in builds" :key="build.Name" :value="build.Name">
                        {{
                            build.needLocalization
                                ? gameLocalization.getText({ localeId: [`${build.Name} ShortName`] }) + " " +
                                  gameLocalization.getText({ localeId: "Stock build" })
                                : build.Name
                        }}
                    </option>
                </select>
            </div>
            <button @click="handleLoad" class="load-button">
                <span class="btn-icon">⬇</span>
                <span>{{gameLocalization.getUIText({localeId: "load"})}}</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useProfilesStore } from "@/stores/profileStore";
import { type SchemaValue, type SchemaData } from "@/types/fields/fields";
import { type Field } from "@/types/fields/fields";
import { gameLocalization } from "@/types/localization";
import { deepClone } from "@/utils/utils";
import { useDataStore } from "@/stores/dataStore";
import { currentProjectTag } from "@/consts/ProjectConsts";
import { type FieldContext } from "@/types/fields/fieldsConsts";

const profilesStore = useProfilesStore();
const dataStore = useDataStore();
const props = defineProps<{
    data: SchemaData;
	field: Field;
	fieldContext: FieldContext;
}>();

const selectRef = ref<HTMLSelectElement | null>(null);
const builds = computed(() => profilesStore.getWeaponBuilds());

function handleLoad(event: Event) {
    if (!selectRef.value) return;
    const target = selectRef.value;
	const value = target.value;
	const itemsArray = props.data[props.field.key]
	if (!value || !itemsArray || !Array.isArray(itemsArray)) return;

	if (props.field.extractWeaponBuildIntoChildren) {
		const res: any = deepClone(profilesStore.getWeaponBuildItems(value))
		const parent = res[0]
		parent.children = res.slice(1)
		itemsArray.push(parent)

		if (props.field.onExtractWeaponBuildIntoChildren) {
			props.field.onExtractWeaponBuildIntoChildren(props.fieldContext, parent)
		}
	} else {
		props.data[props.field.key] = profilesStore.getWeaponBuildItems(value) as unknown as SchemaValue;
    }
}
</script>

<style scoped>
.weapon-build-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #2a2a2a;
    border: 1px solid #3d3d3d;
    border-radius: 6px;
    margin-bottom: 8px;
}

.weapon-build-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #b0b0b0;
}

.label-icon {
    font-size: 14px;
}

.weapon-build-controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.select-wrapper {
    flex: 1;
    position: relative;
}

.weapon-build-select {
    width: 100%;
    padding: 6px 10px;
    background: #222222;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    font-size: 13px;
    color: #e0e0e0;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 14px;
    padding-right: 28px;
}

.weapon-build-select:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.weapon-build-select option {
    background: #222222;
    color: #e0e0e0;
}

.load-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    height: 32px;
    background: #42b883;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    color: #1a1a1a;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.load-button:hover {
    background: #66d9a0;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(66, 184, 131, 0.2);
}

.load-button:active {
    transform: translateY(0);
    box-shadow: none;
}

.btn-icon {
    font-size: 12px;
}
</style>
