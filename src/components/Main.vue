<script setup lang="tsx">
import ListTabs from "@/components/ListTabs.vue";
import RecordEditor from "@/components/RecordEditor.vue";
import type { Tab } from "@/types/tabs";
import { ref, type Component, onMounted } from "vue";
import { gameLocalization } from "@/types/localization";
import ListTabsFrame from "./ListTabsFrame.vue";
import { useDataStore, type dataMapRecordType } from "@/stores/dataStore";
import SettingsComponent from "./SettingsComponent.vue";
import { isElectron } from "@/utils/utils";
import { RecordSchema } from "@/types/fields/fields";
import TradersAssort from "@/project/TradersAssort";
import TradersAssortInput from "./TradersAssortInput.vue";

const dataStore = useDataStore();

function getRecordEditorComponent(content: object, dataStoreId: string): Component {
    return () => {
        const itemsData: Tab[] = [];
        const fileData: Map<string | number, dataMapRecordType> = dataStore.getMap(dataStoreId) ?? {};
        const schemaType = dataStore.getSchemaType(dataStoreId);

        for (const [itemId, itemData] of fileData.entries()) {
			const localizedName: string =
				itemData.data instanceof RecordSchema && itemData.data.getRepresentation
				? itemData.data.getRepresentation()
				: gameLocalization.getObjectLocalization({
                    instance: itemData.data,
            	});

            itemsData.push({
                id: itemId,
                label: localizedName,
                title: localizedName,
                data: itemData.data,
                schemaType: schemaType,
                dataStoreId: dataStoreId,
            });
        }

        return (
            <RecordEditor
                storeId={dataStoreId}
                fileData={fileData}
                schemaType={schemaType}
                itemsData={itemsData}
            ></RecordEditor>
        );
    };
}

function createTab(content: object, dataStoreId: string): Tab {
    const res = {
        id: `tab${dataStoreId}`,
        dataStoreId: dataStoreId,
        // badge: computed(() => dataStore.getMap(dataStoreId).size),
        get badge() {
            return dataStore.getMap(dataStoreId)?.size ?? 0;
		},
		get label() {
            return gameLocalization.getUIText({ localeId: dataStoreId });
        },
        get title() {
            return gameLocalization.getUIText({ localeId: dataStoreId });
        },
        schemaType: dataStore.getSchemaType(dataStoreId),
        component: getRecordEditorComponent(content, dataStoreId),
        ...content,
    };

    return res as Tab;
}

const listTabsRef = ref<Component | undefined>();
const tabsContent = ref<Tab[]>([
    createTab(
        {
            icon: "📋",
        },
        "quests"
    ),
    createTab(
        {
            icon: "📦",
        },
        "items"
    ),
    createTab(
        {
            icon: "🏪",
        },
        "traders"
    ),
    createTab(
        {
            icon: "🗺️",
        },
        "questsZones"
    ),
    createTab(
        {
            icon: "💉",
        },
        "buffs"
    ),
    {
		id: "tradersAssort",
		get label() {
            return gameLocalization.getUIText({ localeId: "tradersAssort" });
        },
        get title() {
            return gameLocalization.getUIText({ localeId: "tradersAssort" });
        },
		icon: "🏪",
		data: TradersAssort.getTradersAssort(),

        component: !isElectron() ? <h1>Electron required</h1> : TradersAssortInput,
	},
    {
        id: "settingsComponent",
        get label() {
            return gameLocalization.getUIText({ localeId: "settings" });
        },
        get title() {
            return gameLocalization.getUIText({ localeId: "settings" });
        },
        icon: "⚙️",

        component: !isElectron() ? <h1>Electron required</h1> : SettingsComponent,
    },
]);

function handleRefresh() {
    console.log("🔄 Обновление таблицы");
}

function handleClose() {
    console.log("❌ Закрытие таблицы");
    // Можно очистить данные или перейти на другую страницу
}

function handleUpdate(data: any) {
    console.log("📦 Обновлены данные:", data);
}

// ===== Создаем фейковую вкладку для обертки =====
// ListTabsFrame ожидает объект Tab, поэтому создаем фиктивную вкладку
const wrapperTab = ref<Tab>({
    id: "main-tabs",
    get label() {
        return gameLocalization.getUIText({ localeId: "dataManage" });
    },
    get title() {
        return gameLocalization.getUIText({ localeId: "dataManage" });
    },
    // Компонент будет рендерить ListTabs
    component: () => <ListTabs tabs={tabsContent.value} />,
});
</script>

<template>
    <div class="app-container">
        <!-- ✅ Оборачиваем ListTabs в ListTabsFrame -->
        <ListTabsFrame
            :tab="wrapperTab"
            @refresh="handleRefresh"
            @close="handleClose"
            @update="handleUpdate"
            :hasCloseReloadButtons="false"
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
    height: calc(100vh);
    width: 100%;
    padding: 0px;
    margin: 0px;
    background: #1a1a1a;
}

#app {
    width: 100%;
    padding: 0px;
    margin: 0px;
    background: #0a0a0a;
}
</style>
