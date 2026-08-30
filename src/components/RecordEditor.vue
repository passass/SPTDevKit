<script setup lang="tsx">
	import RecordEditorInput from "./RecordEditorInput.vue";
	import ListTabs from "./ListTabs.vue";
	import type { Tab } from "@/tabs/tabs.ts";
	import type { PropType } from "vue";
	import { RecordSchema } from "@/types/fields/fields";
	import { type ClassType } from "@/utils/classUtils";
	import { type dataStoreType } from "@/stores/dataStore";

	const props = defineProps<{
		itemsData: Tab[]
		schemaType?: ClassType<RecordSchema>
		fileData?: dataStoreType<RecordSchema>
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
