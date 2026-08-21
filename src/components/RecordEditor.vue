<script setup lang="tsx">
	import RecordEditorInput from "./RecordEditorInput.vue";
	import ListTabs from "./ListTabs.vue";
	import type { Tab } from "@/tabs/tabs.ts";
	import type { PropType } from "vue";
	import { RecordSchema } from "@/types/fields/fields.ts";
	import { type ClassType } from "@/utils/classUtils.ts";
	import { type dataStoreType } from "@/stores/dataStore.ts";

	const props = defineProps<{
		itemsData: Tab[]
		schemaType?: ClassType<RecordSchema>
		fileData?: dataStoreType<RecordSchema>
	}>()
</script>

<template>
	<ListTabs 
	:isSearch="true"
	:schemaType="props.schemaType"
	:fileData="props.fileData"
	:tabs="props.itemsData">
		<template #content="{ data }">
			<RecordEditorInput :data="data" />
		</template>
	</ListTabs>
</template>