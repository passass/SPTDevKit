<script setup lang="tsx">
	import RecordEditorInput from "./RecordEditorInput.vue";
	import ListTabs from "./ListTabs.vue";
	import type { Tab } from "@/types/tabs";
	import { type dataMapRecordType } from "@/stores/dataStore";

	const props = defineProps<{
		itemsData: Tab[]
		schemaType?: Tab["schemaType"]
		fileData?: Map<string, dataMapRecordType>
		storeId?: string
	}>()
</script>

<template>
	<ListTabs
	:isSearch="true"
	:schemaType="props.schemaType"
	:storeId="props.storeId"
	:fileData="props.fileData"
	:tabs="props.itemsData">
		<template #content="{ data, listTabs }">
			<RecordEditorInput :data="data" :list-tabs="listTabs"/>
		</template>
	</ListTabs>
</template>
