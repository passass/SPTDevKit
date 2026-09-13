<template>
    <div v-if="frameNavigator">
    	<RecordEditorInput :notHasDeleteAndCopyButtons="true" :data="frameNavigator.displayData" :list-tabs="listTabs">
    	</RecordEditorInput>
    </div>
</template>

<script setup lang="tsx">
import RecordEditorInput from './RecordEditorInput.vue';
import ListTabs from './ListTabs.vue';
import { RecordSchema } from '@/types/fields/fields';
import { Navigator } from '@/utils/navigation';
import { inject } from 'vue';

// defineOptions({ inheritAttrs: false });
const frameNavigator = inject<Navigator>("frameNavigator");

const props = defineProps<{
	listTabs?: InstanceType<typeof ListTabs>;
}>();

</script>
