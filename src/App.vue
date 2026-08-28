<script setup lang="tsx">
import { useFileDataStore } from "@/stores/fileStore.ts";
import { onMounted, ref } from "vue";
import Main from "@/components/Main.vue";
import { gameLocalization } from "@/types/localization";
import { useDataStore } from "@/stores/dataStore";
import { QuestSchema } from "./types/fields/fieldsQuests";
import { loadAllLazySchemas } from "./utils/lazySchemaLoader";
import { isElectron } from "./utils/utils";
import Traders from "./project/Traders";
import { generateSchemasInFile } from "./utils/schemaGenerator";
import Project from "./project/Project";
// import pathResolver from '@/utils/pathUtils.ts';

const dataStore = useDataStore()
const isLoading = ref(true)
const error = ref<string | null>(null)

async function loadData() {
	try {
		await Promise.all([
			dataStore.registerMultiple({
				quests: { 
					file: [
						{
							filename: "quests.json"
							, tags: ["vanilla"]
						}
					], 
					schemaType: QuestSchema
				},
				items: {  
					file: [
						{
							filename: 'items.json'
						}
					], 
				},
			})
			, gameLocalization.loadLocales()
			, Project.init()
		])

		await dataStore.loadAll();

		await loadAllLazySchemas()
	} catch (e: any) {
		error.value = e.message
		console.error('Failed to load data:', e)
	} finally {
		isLoading.value = false
	}
}

onMounted(async () => {
    await loadData();
});
</script>
 
<template>
	<div v-if="error" class="error-state">
		<h1>Ошибка загрузки</h1>
		<p>{{ error }}</p>
		<button @click="loadData">Повторить</button>
	</div>
	<div v-else-if="isLoading || !dataStore.isAllLoaded()">
		<h1>Загрузка...</h1>
	</div>
	<div v-else>
		<Main></Main>
	</div>
</template>

<style scoped>
.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	color: #ff6b6b;
	gap: 16px;
}

.error-state button {
	padding: 8px 24px;
	background: #42b883;
	border: none;
	border-radius: 6px;
	color: #1a1a1a;
	font-size: 16px;
	cursor: pointer;
}

.error-state button:hover {
	background: #66d9a0;
}
</style>