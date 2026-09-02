<script setup lang="tsx">
import ListTabs from "@/components/ListTabs.vue";
import RecordEditor from "@/components/RecordEditor.vue";
import type { Tab } from "@/tabs/tabs.ts";
import { ref, type Component, type Ref, provide, computed } from 'vue'
import { choiceStrings, gameLocalization, type locales } from "@/types/localization";
import ListTabsFrame from "./ListTabsFrame.vue";
import type { RecordSchema } from "@/types/fields/fields.ts";
import { useDataStore, type dataMapRecordType } from "@/stores/dataStore";
import { getStaticField, type ClassType } from "@/utils/classUtils";
import SettingsComponent from "./SettingsComponent.vue";
import { isElectron } from "@/utils/utils";
import { generateAllSchemas } from "@/utils/schemaGenerator";


const dataStore = useDataStore()

function getRecordEditorComponent(content: object, dataStoreId: string): Component {
	return () => {
		const itemsData: Tab[] = []
		const fileData: Map<string, dataMapRecordType> = dataStore.getMap(dataStoreId) ?? {};
		const schemaType = dataStore.getSchemaType(dataStoreId)

		for (const [itemId, itemData] of fileData.entries()) {
			const localizedName: string = gameLocalization.getObjectLocalization({
				instance: itemData.data,
			})

			itemsData.push(
				{
					id: itemId,
					label: localizedName,
					title: localizedName,
					data: itemData.data,
					schemaType: schemaType,
					dataStoreId: dataStoreId,
				}
			);
		}

		return <RecordEditor
			storeId={dataStoreId}
			fileData={fileData}
			schemaType={schemaType}
			itemsData={itemsData}
		></RecordEditor>
	}
}

function createTab(content: object, dataStoreId: string): Tab {
	const res = {
		id: `tab${dataStoreId}`,
        dataStoreId: dataStoreId,
        // badge: computed(() => dataStore.getMap(dataStoreId).size),
        get badge() {
            return dataStore.getMap(dataStoreId)?.size ?? 0;
        },
		schemaType: dataStore.getSchemaType(dataStoreId),
		component: getRecordEditorComponent(content, dataStoreId),
		...content
	}

	return res as Tab
}

const tabsContent = ref<Tab[]>([
	createTab({
		label: "Квесты",
		icon: "📋",
		title: "Управление квестами",
	}, 'quests'),
	createTab({
		label: "Предметы",
		icon: "📦",
		title: "Редактор предметов",
	}, 'items'),
	createTab({
		label: "Торговцы",
		icon: "🏪",
		title: "Торговцы",
	}, 'traders'),
	{
		id: "settings",
		label: "Настройки",
		icon: "⚙️",

		title: "Настройки приложения",
		component: !isElectron()
		? (<h1>Electron required</h1>)
		: (<SettingsComponent></SettingsComponent>)
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
