<script setup lang="tsx">
import ListTabs from "@/components/ListTabs.vue";
import RecordEditor from "@/components/RecordEditor.vue";
import type { Tab } from "@/tabs/tabs.ts";
import { ref, type Component, type Ref, provide } from 'vue'
import { choiceStrings, gameLocalization, type locales } from "@/types/localization";
import ListTabsFrame from "./ListTabsFrame.vue";
import type { RecordSchema } from "@/types/fields/fields.ts";
import { useDataStore, type dataStoreType } from "@/stores/dataStore.ts";
import type { ClassType } from "@/utils/classUtils.ts";


const dataStore = useDataStore()

const currentLocale: Ref<locales> = ref('ru')
provide('currentLocale', currentLocale)

function getRecordEditorComponent(dataStoreId: string): Component {
	return () => {
		const itemsData: Tab[] = []
				
		const fileData: dataStoreType<RecordSchema> = dataStore.getMap(dataStoreId) ?? {};
		const schemaType = dataStore.getSchemaType(dataStoreId)


		for (const [itemId, itemData] of fileData.entries()) {
			const localizedName: string = gameLocalization.getText({
				localeId: [`${itemId} Name`, `${itemId} name`]
				, locale: currentLocale.value as locales
			})

			itemsData.push(
				{
					id: itemId,
					label: localizedName,
					title: localizedName,
					data: itemData,
					schemaType: schemaType
				}
			);
		}

		return <RecordEditor
			fileData={fileData}
			schemaType={schemaType}
			itemsData={itemsData}
		></RecordEditor>
	}
}

function createTab(content: object, dataStoreId: string): Tab {
	const res = {
		id: `tab${dataStoreId}`,
		badge: dataStore.getMap(dataStoreId).size,
		schemaType: dataStore.getSchemaType(dataStoreId),
		component: getRecordEditorComponent(dataStoreId),
		...content
	}

	return res as Tab
}

const questsData = dataStore.getMap("quests")
const itemsData = dataStore.getMap("items")

const tabsContent = ref<Tab[]>([
	createTab({
		label: "Квесты",
		icon: "📋",
		title: "Управление квестами",
	}, 'quests'),
	{
		id: "items",
		label: "Предметы",
		icon: "📦",
		badge: itemsData.size,
		title: "Редактор предметов",
		schemaType: dataStore.getSchemaType("items"),
		component: getRecordEditorComponent('items'),
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
