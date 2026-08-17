<script setup lang="tsx">
import { useFileDataStore } from "@/stores/fileStore.ts";
import { onMounted } from "vue";
import Main from "@/components/Main.vue";
import { gameLocalization } from "@/types/localization";
import { useDataStore } from "@/stores/dataStore";
import { QuestSchema } from "./types/fields/fieldsQuests";

const dataStore = useDataStore()

dataStore.registerMultiple({
	quests: { 
		filename: ['quests.json'], 
		schemaType: QuestSchema 
	},
	items: { 
		filename: ['items.json'] 
	},
})
gameLocalization.loadLocales()

dataStore.loadAll();

</script>
 
<template>
	<div v-if="dataStore.isAllLoaded()">
		<Main></Main>
	</div>
	<div v-else>
		<h1>
			Загрузка
		</h1>
	</div>
	
</template>

<style scoped></style>
