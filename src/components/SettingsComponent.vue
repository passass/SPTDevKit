<template>
	<div class="settings-container">
		<FolderSelector
			v-model="selectedPath"
			:loading="isLoading"
			label="Выбрать папку проекта"
			icon="📁"
			variant="project"
			@select="selectFolder"
		/>

		<FolderSelector
			v-model="eftPath"
			:loading="isLoadingEft"
			label="Выбрать папку EFT"
			icon="🎮"
			path-icon="🎮"
			variant="eft"
			@select="selectEftFolder"
		/>

		<button @click="Project.saveProject()">
			Сохранить
		</button>
	</div>
</template>

<script setup lang="ts">
import { isElectron } from '@/utils/utils';

if (!isElectron()) throw new Error("это компонент работает только в electron");

import { ref, onMounted } from 'vue';
import Project, { currentProjectTag } from '@/project/Project';
import { useDataStore } from '@/stores/dataStore';
import { RecordSchema } from '@/types/fields/fields';
import { SchemaChoicer } from '@/types/fields/fieldsSchemaChoicer';
import FolderSelector from '@/components/selectors/FolderSelector.vue';
import { Path } from '@/utils/pathUtils';

const selectedPath = ref<string>(Project.currentProjectFolder?.filePath ?? '');
const isLoading = ref(false);
const eftPath = ref<string>('');
const isLoadingEft = ref(false);

async function selectFolder() {
    if (isLoading.value) return;

    isLoading.value = true;
    try {
        const folderPath = await window.electronAPI.selectFolder();

        if (!folderPath) {
            console.log('Выбор папки отменён');
            return;
        }

		Project.loadProject(new Path(folderPath))
        selectedPath.value = folderPath;

    } catch (error) {
        console.error('Ошибка при выборе папки:', error);
        alert('Ошибка при выборе папки');
    } finally {
        isLoading.value = false;
    }
}

async function selectEftFolder() {
	if (isLoadingEft.value) return;

	isLoadingEft.value = true;
	try {
		const folderPath = await window.electronAPI.selectFolder();

		if (!folderPath) {
			console.log('Выбор папки EFT отменён');
			return;
		}

		eftPath.value = folderPath;
		localStorage.setItem('eftFolderPath', folderPath);
		console.log('Папка EFT сохранена:', folderPath);
		Project.loadEFTMods(new Path(folderPath))
	} catch (error) {
		console.error('Ошибка при выборе папки EFT:', error);
		alert('Ошибка при выборе папки EFT');
	} finally {
		isLoadingEft.value = false;
	}
}

onMounted(() => {
	const savedEftPath = localStorage.getItem('eftFolderPath');
	if (savedEftPath) {
		eftPath.value = savedEftPath;
	}
});
</script>

<style scoped>
.settings-container {
	padding: 20px;
}
</style>
