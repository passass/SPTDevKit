<template>
    <div class="tab-container">
        <!-- Левая панель - список вкладок -->
        <div class="tab-list" ref="tabListRef">
            <!-- Поиск -->
            <div v-if="isSearch" class="search-container">
                <div class="search-wrapper">
                    <span class="search-icon">🔍</span>
                    <input
                        ref="searchInput"
                        v-model="searchQuery"
                        type="text"
                        class="search-input"
                        :placeholder="searchPlaceholder || 'Поиск вкладок...'"
                        @input="handleSearch"
                        @keydown.esc="clearSearch"
                    />
                    <button v-if="searchQuery" class="search-clear" @click="clearSearch" title="Очистить поиск">
                        ✕
                    </button>
                </div>
                <div v-if="searchQuery" class="search-info">
                    <span class="search-count"> Найдено: {{ filteredTabs.length }} из {{ tabs.length }} </span>
                </div>
            </div>

            <div v-if="availableTags.length > 0" class="tag-filter-container">
                <div class="tag-filter-label">Фильтр по тегам:</div>
                <div class="tag-filter-list">
                    <label
                        v-for="tag in availableTags"
                        :key="tag"
                        class="tag-filter-item"
                        :class="{ active: selectedTags.includes(tag) }"
                    >
                        <input
                            type="checkbox"
                            :value="tag"
                            v-model="selectedTags"
                            @change="handleTagFilter"
                        />
                        <span>{{ tag }}</span>
                    </label>
                </div>
            </div>

            <button v-if="schemaType" class="create-btn" @click="createNewSchema">Создать</button>

            <!-- Виртуальный список вкладок -->
            <DynamicScroller
                v-if="filteredTabs.length > 0"
                class="tab-scroller"
                :items="filteredTabs"
                :min-item-size="36"
                key-field="id"
                ref="tabListRef"
            >
                <template #default="{ item, index, active }">
                    <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[item.label]">
                        <div
                            class="tab-item"
                            :class="{
                                active: activeTab === item.id,
                                hidden: !isTabVisible(item.id),
                            }"
                            @click="selectTab(item.id)"
                            :title="item.label"
                        >
                            <span v-if="item.icon" class="tab-icon">{{ item.icon }}</span>
                            <component
                                class="tab-label"
                                :class="{
                                    'has-badge': !(item.badge === null || item.badge === undefined),
                                    'not-has-badge': item.badge === null || item.badge === undefined,
                                }"
                                :is="highlightMatch(item.label)"
                            ></component>
                            <span v-if="item.badge" class="tab-badge">{{ item.badge }}</span>
                        </div>
                    </DynamicScrollerItem>
                </template>
            </DynamicScroller>
            <!-- Сообщение, если ничего не найдено -->
            <div v-if="isSearch && searchQuery && filteredTabs.length === 0" class="no-results">
                <span class="no-results-icon">🔍</span>
                <span>Ничего не найдено</span>
            </div>
        </div>

        <!-- Правая панель -->
        <div class="tab-content">
            <ListTabsFrame
                v-if="currentTab"
                :tab="currentTab"
                :list-tabs="this"
                @refresh="refreshTab"
                @close="closeTab"
                @update="handleContentUpdate"
            >
                <template #content="{ data, listTabs }">
                    <slot name="content" :data="data" :list-tabs="listTabs"></slot>
                </template>
            </ListTabsFrame>
            <div v-else class="empty-state">
                <p>Выберите вкладку для просмотра</p>
            </div>
        </div>
    </div>
</template>

<script lang="tsx">
import { defineComponent, ref, computed, onMounted, inject, nextTick, toValue } from "vue";
import ListTabsFrame from "./ListTabsFrame.vue";
import type { Tab } from "@/types/tabs";
import type { Component } from "vue";
import { type dataMapRecordType } from "@/stores/dataStore";
import { useDataStore } from "@/stores/dataStore";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { Navigator } from "@/utils/navigation";
import { currentProjectTag, modTag, vanillaTag } from "@/consts/ProjectConsts";
import { generateUUID24chars } from "@/utils/uuidUtils";

export default defineComponent({
    name: "ListTabs",
    components: {
        ListTabsFrame,
        DynamicScroller,
        DynamicScrollerItem,
    },
    props: {
        tabs: { type: Array as () => Tab[], required: true },
        schemaType: { type: Object as () => Tab["schemaType"] },
        storeId: { type: String },
        fileData: { type: Object as () => Map<string | number, dataMapRecordType> },
        isSearch: { type: Boolean },
        searchPlaceholder: { type: String },
        caseSensitive: { type: Boolean },
        searchFields: { type: Array as () => Array<keyof Tab> },
	},
    emits: ["tab-selected", "refresh", "content-update", "search"],
    setup(props, { emit }) {
        const dataStore = useDataStore();
        const frameNavigator = inject<Navigator | null>("frameNavigator", null);
        const activeTab = ref<string | number | null>(null);
        const searchQuery = ref("");

        const selectedTags = ref<string[]>([]);
        const filterableTags = [currentProjectTag, vanillaTag, modTag];

        const availableTags = computed(() => {
            const present = new Set<string>();
            for (const tab of props.tabs) {
                const record = props.fileData?.get(tab.id);
                if (record?.tags) {
                    for (const tag of record.tags) present.add(tag);
                }
            }
            return filterableTags.filter((tag) => present.has(tag));
        });

        const currentTab = computed(() => {
            return props.tabs.find((t) => t.id === activeTab.value);
        });

        const filteredTabs = computed(() => {
            let result = props.tabs;

            // Фильтрация по тегам
            if (selectedTags.value.length > 0 && props.fileData) {
                const fileData = props.fileData;
				result = result.filter((tab) => {
                    const record = fileData.get(tab.id);
                    if (!record?.tags) return false;
                    return selectedTags.value.every((tag) => record.tags!.includes(tag));
                });
            }

            // Фильтрация по поиску
            if (!props.isSearch || !searchQuery.value.trim()) {
                return result;
            }
            const query = props.caseSensitive
                ? searchQuery.value.trim()
                : searchQuery.value.trim().toLowerCase();
            return result.filter((tab) => {
                const label = props.caseSensitive ? tab.label.trim() : tab.label.trim().toLowerCase();
                const id = typeof tab.id === "string" ? (props.caseSensitive ? tab.id.trim() : tab.id.trim().toLowerCase()) : tab.id.toString();
                return label.includes(query) || id.includes(query);
            });
		});

        function isTabVisible(tabId: string | number): boolean {
            const hasSearch = props.isSearch && !!searchQuery.value.trim();
            const hasTagFilter = selectedTags.value.length > 0;
            if (!hasSearch && !hasTagFilter) {
                return true;
            }
            return filteredTabs.value.some((t) => t.id === tabId);
		}

		function handleTagFilter() {
		    if (activeTab.value && !isTabVisible(activeTab.value)) {
		        if (filteredTabs.value.length > 0) {
		            selectTab(filteredTabs.value[0]?.id ?? "");
		        } else {
		            activeTab.value = null;
		        }
		    }
		}

		function createNewSchema() {
            if (!props.fileData || !props.schemaType) return;
			const newInstance = props.schemaType.from({}, {
				isCreating: true
			});
			if (!newInstance) return;
			if (props.storeId) {
				if (dataStore.isArray(props.storeId)) {
					dataStore.addSchema(props.storeId, newInstance, undefined, currentProjectTag);
					selectTab(dataStore.getArray(props.storeId).length - 1);
				} else {
					const newInstanceId = newInstance.getId() ?? generateUUID24chars();
					dataStore.addSchema(props.storeId, newInstance, newInstanceId, currentProjectTag);
					selectTab(newInstanceId);
				}

            }
        }

        function selectTab(tabId: string | number) {
            if (isTabVisible(tabId)) {
                if (activeTab.value !== tabId) {
                    frameNavigator?.goRoot?.();
                }
                activeTab.value = tabId;
                localStorage.setItem("activeTab", tabId.toString());
                emit("tab-selected", tabId);
            }
        }

        function refreshTab() {
            emit("refresh", activeTab.value);
        }

        function closeTab() {
            activeTab.value = null;
            localStorage.removeItem("activeTab");
        }

        function handleContentUpdate(data: any) {
            emit("content-update", data);
        }

        function handleSearch() {
            if (activeTab.value && !isTabVisible(activeTab.value)) {
                if (filteredTabs.value.length > 0) {
                    selectTab(filteredTabs.value[0]?.id ?? "");
                } else {
                    activeTab.value = null;
                }
            }
            emit("search", searchQuery.value);
        }

        function clearSearch() {
            searchQuery.value = "";
            handleSearch();
            nextTick(() => {
                const input = document.querySelector(".search-input") as HTMLInputElement;
                if (input) input.focus();
            });
        }

        function highlightMatch(text: string): Component {
            if (!props.isSearch || !searchQuery.value.trim() || !text) {
                return <span>{text}</span>;
            }
            const query = props.caseSensitive ? searchQuery.value.trim() : searchQuery.value.trim().toLowerCase();
            const searchText = props.caseSensitive ? text : text.toLowerCase();
            const index = searchText.indexOf(query);
            if (index === -1) return <span>{text}</span>;

            const before = text.substring(0, index);
            const match = text.substring(index, index + query.length);
            const after = text.substring(index + query.length);

            return (
                <span>
                    {before}
                    <span class="search-highlight">{match}</span>
                    {after}
                </span>
            );
        }

        onMounted(() => {
            const savedTab = localStorage.getItem("activeTab");
            if (savedTab && props.tabs.some((t) => t.id === savedTab)) {
                activeTab.value = savedTab;
            } else if (props.tabs.length > 0) {
                activeTab.value = props.tabs[0]?.id || null;
            }
        });

        return {
            activeTab,
            searchQuery,
            currentTab,
            filteredTabs,
            createNewSchema,
            selectTab,
            refreshTab,
            closeTab,
            handleContentUpdate,
			isTabVisible,
			handleTagFilter,
			selectedTags,
            availableTags,
            handleSearch,
            clearSearch,
            highlightMatch,
            dataStore,
            frameNavigator,
        };
    },
});
</script>

<style scoped>
/* ===== ОСНОВНОЙ КОНТЕЙНЕР ===== */
.tab-container {
    display: flex;
    height: 100%;
    min-height: 400px;
    background: #1e1e1e;
    color: #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* ===== ЛЕВАЯ ПАНЕЛЬ (flex-элемент) ===== */
.tab-list {
    width: 48px;
    min-width: 48px;
    background: #2d2d2d;
    padding: 8px 0;
    border-right: 1px solid #3d3d3d;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
    transition: width 0.25s ease;
}

.tab-list:hover {
    width: 220px;
    overflow-y: auto;
}

/* ===== СКРОЛЛЕР ДЛЯ ВКЛАДОК ===== */
.tab-scroller {
    flex: 1;
    height: 100%;
    width: 100%;
}

/* ===== ПОИСК ===== */
.search-container {
    padding: 0 12px 8px 12px;
    border-bottom: 1px solid #3d3d3d;
    margin-bottom: 4px;
    flex-shrink: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
}

.tab-list:hover .search-container {
    opacity: 1;
    visibility: visible;
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: #3d3d3d;
    border-radius: 6px;
    border: 1px solid #4a4a4a;
    transition: border-color 0.2s;
}

.search-wrapper:focus-within {
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.search-icon {
    position: absolute;
    left: 10px;
    color: #666;
    font-size: 14px;
    pointer-events: none;
}

.search-input {
    width: 100%;
    padding: 8px 32px 8px 34px;
    background: transparent;
    border: none;
    outline: none;
    color: #e0e0e0;
    font-size: 13px;
    font-family: inherit;
}

.search-input::placeholder {
    color: #666;
}

.search-clear {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 6px;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-clear:hover {
    color: #fff;
    background: #4a4a4a;
}

.search-info {
    padding: 4px 4px 0 4px;
    text-align: right;
}

.search-count {
    font-size: 11px;
    color: #666;
}

/* ===== КНОПКА СОЗДАТЬ ===== */
.create-btn {
    margin: 0 12px 4px 12px;
    padding: 8px 16px;
    background: #42b883;
    border: none;
    border-radius: 6px;
    color: #1a1a1a;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0;
    visibility: hidden;
    white-space: nowrap;
}

.tab-list:hover .create-btn {
    opacity: 1;
    visibility: visible;
}

.create-btn:hover {
    background: #66d9a0;
}

/* ===== ЭЛЕМЕНТ ВКЛАДКИ ===== */
.tab-item {
    display: flex;
    align-items: flex-start; /* Изменено на flex-start, чтобы текст при переносе не центрировался вертикально */
    padding: 8px 14px;
    min-height: 36px;
    height: auto;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;
    border-left: 3px solid transparent;
    gap: 8px;
    user-select: none;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    justify-content: flex-start;
    box-sizing: border-box;
    position: relative;
}

.tab-item:hover {
    background: #3a3a3a;
}

.tab-item.active {
    background: #3d3d3d;
    border-left-color: #42b883;
}

.tab-item.hidden {
    display: none;
}

.tab-item .tab-icon {
    font-size: 18px;
    width: 24px;
    height: 20px; /* Фиксированная высота для иконки, чтобы она не растягивалась */
    line-height: 20px;
    text-align: center;
    flex-shrink: 0;
    margin-top: 2px; /* Небольшой отступ сверху для визуального выравнивания с первой строкой текста */
}

.tab-item .tab-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    word-break: break-word;
    overflow-wrap: break-word;
    min-width: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    margin: 0;
    padding: 0;
}

.tab-item .tab-label.has-badge {
    flex: 0 0 110px;
}

.tab-item .tab-label.not-has-badge {
    flex: 0 0 190px;
}

/* При наведении на панель показываем текст, но перенос только если есть класс .is-expanded */
.tab-list:hover .tab-item .tab-label {
    opacity: 1;
    visibility: visible;
}

.search-highlight {
    background: #42b883;
    color: #1a1a1a;
    padding: 1px 4px;
    border-radius: 2px;
    font-weight: 600;
}

.tab-item .tab-badge {
    background: #42b883;
    color: #1e1e1e;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 12px;
    min-width: 18px;
    text-align: center;
    flex-shrink: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
}

.tab-list:hover .tab-item .tab-badge {
    opacity: 1;
    visibility: visible;
}

.tab-item.active .tab-badge {
    background: #66d9a0;
}

/* ===== НЕТ РЕЗУЛЬТАТОВ ===== */
.no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 16px;
    color: #666;
    font-size: 14px;
    gap: 8px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
}

.tab-list:hover .no-results {
    opacity: 1;
    visibility: visible;
}

.no-results-icon {
    font-size: 32px;
    opacity: 0.5;
}

/* ===== ПРАВАЯ ПАНЕЛЬ ===== */
.tab-content {
    flex: 1;
    padding: 4px;
    background: #252525;
    overflow: auto;
    min-width: 0;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #666;
    font-size: 16px;
}

/* ===== СКРОЛЛ ДЛЯ DynamicScroller ===== */
.tab-scroller {
    flex: 1;
    height: 100%;
    width: 100%;
    overflow: auto;
    background: rgba(0, 0, 0, 0.2);
    scrollbar-width: thin;
    scrollbar-color: #555 rgba(255, 255, 255, 0.02);
}

.tab-scroller::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.tab-scroller::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
}

.tab-scroller::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 10px;
}

.tab-scroller::-webkit-scrollbar-thumb:hover {
    background: #777;
}

/* ===== ФИЛЬТР ПО ТЕГАМ ===== */
.tag-filter-container {
    padding: 6px 12px 8px 12px;
    border-bottom: 1px solid #3d3d3d;
    margin-bottom: 4px;
    flex-shrink: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
}

.tab-list:hover .tag-filter-container {
    opacity: 1;
    visibility: visible;
}

.tag-filter-label {
    font-size: 11px;
    color: #888;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.tag-filter-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 0 0 190px;
}

.tag-filter-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    background: #3d3d3d;
    border: 1px solid #4a4a4a;
    border-radius: 12px;
    font-size: 11px;
    color: #b0b0b0;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;
    white-space: nowrap;
}

.tag-filter-item:hover {
    border-color: #42b883;
    color: #e0e0e0;
}

.tag-filter-item.active {
    background: #42b883;
    border-color: #42b883;
    color: #1a1a1a;
}

.tag-filter-item input[type="checkbox"] {
    display: none;
}
</style>
