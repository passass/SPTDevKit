<script setup lang="tsx">
import ListTabs from "@/components/ListTabs.vue";
import RecordEditor from "@/components/RecordEditor.vue";
import type { Tab } from "@/tabs/tabs.ts";
import { ref, type Component } from 'vue'
import { JsonConvert } from "json2typescript"
import { useFileDataStore } from "@/stores/fileStore.ts";
import { gameLocalization } from "@/types/localization";
import ListTabsFrame from "./ListTabsFrame.vue";
import type { RecordSchema, SchemaConstructor } from "@/types/fields.ts";
import { QuestSchema } from "@/types/fieldsQuests.ts";

const fileStore = useFileDataStore()

function getRecordEditorComponent(filename: string, schemaType?: SchemaConstructor): Component {
	return () => {
		const itemsData: Tab[] = []
				
		const fileData = fileStore.getData(filename) ?? {};
		
		for (const [itemId, itemData] of Object.entries(fileData)) {
			if (itemData && typeof itemData === "object")
				itemsData.push(
					{
						id: itemId,
						label: (
							gameLocalization.getText(`${itemId} Name`)
							?? gameLocalization.getText(`${itemId} name`)
							?? itemId), //  
						title: itemId,
						data: schemaType ? new schemaType(itemData) : itemData
					}
				);
		}

		return <RecordEditor
			itemsData={itemsData}
		></RecordEditor>
	}
}

const {loaded: questsLoaded, data: questsData} = fileStore.getDataIfLoaded("quests.json")
const {loaded: itemsLoaded, data: itemsData} = fileStore.getDataIfLoaded("items.json")

const tabsContent = ref<Tab[]>([
	{
		id: "quests",
		label: "Квесты",
		icon: "📋",
		badge: questsLoaded ? Object.keys(questsData).length : null,

		title: "Управление квестами",
		component: getRecordEditorComponent('quests.json', QuestSchema),
	},
	{
		id: "items",
		label: "Предметы",
		icon: "📦",
		badge: itemsLoaded ? Object.keys(itemsData).length : null,
		title: "Редактор предметов",
		component: getRecordEditorComponent('items.json'),
	},
	{
		id: "traders",
		label: "Торговцы",
		icon: "🏪",
		badge: 5,

		title: "Торговцы и репутация",
	},
	{
		id: "settings",
		label: "Настройки",
		icon: "⚙️",
		badge: null,

		title: "Настройки приложения",
	},
]);

function handleRefresh() {
	console.log('🔄 Обновление таблицы')
}

function handleClose() {
	console.log('❌ Закрытие таблицы')
	// Можно очистить данные или перейти на другую страницу
}

function handleUpdate(data: any) {
	console.log('📦 Обновлены данные:', data)
}

// ===== Создаем фейковую вкладку для обертки =====
// ListTabsFrame ожидает объект Tab, поэтому создаем фиктивную вкладку
const wrapperTab = ref<Tab>({
	id: 'main-tabs',
	label: 'Главная',
	title: '📊 Управление данными',
	// Компонент будет рендерить ListTabs
	component: () => <ListTabs tabs={tabsContent.value} />
})

</script>

<template>

	<div class="app-container">
		<!-- ✅ Оборачиваем ListTabs в ListTabsFrame -->
		<ListTabsFrame
			:tab="wrapperTab"
			@refresh="handleRefresh"
			@close="handleClose"
			@update="handleUpdate"
		>
			<!-- Слот для содержимого -->
			<template #content>
				<!-- Здесь будет ListTabs -->
				<ListTabs :tabs="tabsContent" />
			</template>
		</ListTabsFrame>
	</div>
</template>

<style scoped>
.app-container {
	height: calc(100vh - 25px);
	width: 100%;
	background: #1a1a1a;
}

#app {
	height: 100%;
	background: #0a0a0a;
}
</style>
