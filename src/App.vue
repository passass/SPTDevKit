<script setup lang="tsx">
import { useFileDataStore } from "@/stores/fileStore.ts";
import { onMounted } from "vue";
import Main from "@/components/Main.vue";
import { gameLocalization } from "@/types/localization";

const fileStore = useFileDataStore()

onMounted(async () => {
	fileStore.read("quests.json")
	fileStore.read("items.json")

	gameLocalization.loadLocales()
})
</script>

<template>
	<div v-if="fileStore.isAllLoaded">
		<Main></Main>
	</div>
	<div v-else>
		<h1>
			Загрузка
		</h1>
	</div>
	
</template>

<style scoped></style>
