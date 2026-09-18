<script setup lang="tsx">
import { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";
import { onMounted, ref } from "vue";
import Main from "@/components/Main.vue";
import { gameLocalization } from "@/types/localization";
import { useDataStore } from "@/stores/dataStore";
import { QuestSchema } from "./types/schemas/quests";
import { loadAllLazySchemas } from "./utils/lazySchemaLoader";
import Project from "./project/Project";
import { itemsSchema } from "@/types/schemas/items";
// import pathResolver from '@/utils/pathUtils.ts';

const dataStore = useDataStore()
const isLoading = ref(true)
const error = ref<string | null>(null)

async function loadData() {
	try {
		await loadAllLazySchemas();
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
							, tags: ["vanilla"]
						}
					],
					schemaType: itemsSchema
				},
			})
			, gameLocalization.loadLocales()
			, Project.init()
		])

		await dataStore.loadAll();

	} catch (e: any) {
		error.value = `${e.message}`
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
		<h1>Loading Error</h1>
		<p>{{ error }}</p>
		<button @click="loadData">repeat</button>
	</div>
	<div v-else-if="isLoading || !dataStore.isAllLoaded()">
		<h1>Loading...</h1>
	</div>
	<div v-else>
		<Main></Main>
	</div>
</template>

<style>
html, body, #app {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
}
</style>

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
