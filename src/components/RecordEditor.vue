<script lang="tsx">
	import RecordEditorInput from "./RecordEditorInput.vue";
	import ListTabs from "./ListTabs.vue";
	import type { Tab } from "@/tabs/tabs.ts";
	import type { PropType } from "vue";

	export default {
		components: {
			ListTabs,
			RecordEditorInput
		},

		props: {
			itemsData: {
				type: Array as PropType<Tab[]>,
				required: true,
			},
		},
	};
</script>

<template>
	<ListTabs 
	:isSearch="true"
	:tabs="itemsData">
		<template #content="{ data }">
			<RecordEditorInput :data="data" />
		</template>
	</ListTabs>
</template>