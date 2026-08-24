<template>
	<div class="tab-container">
		<!-- Левая панель - список вкладок -->
		<div class="tab-list">
			<!-- ✅ Поле поиска -->
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
					<button 
						v-if="searchQuery" 
						class="search-clear" 
						@click="clearSearch"
						title="Очистить поиск"
					>
						✕
					</button>
				</div>
				<div v-if="searchQuery" class="search-info">
					<span class="search-count">
						Найдено: {{ filteredTabs.length }} из {{ tabs.length }}
					</span>
				</div>
			</div>

			<button
				v-if="schemaType"
				@click="createNewSchema"
			>
				Создать
			</button>


			<!-- Список вкладок -->
			<div
				v-for="tab in filteredTabs"
				:key="tab.id"
				:class="['tab-item', { active: activeTab === tab.id, hidden: !isTabVisible(tab.id) }]"
				@click="selectTab(tab.id)"
				:title="tab.label"
			>
				<span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
				<component class="tab-label" :is="highlightMatch(tab.label)"></component>
				<span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
			</div>

			<!-- Сообщение, если ничего не найдено -->
			<div v-if="isSearch && searchQuery && filteredTabs.length === 0" class="no-results">
				<span class="no-results-icon">🔍</span>
				<span>Ничего не найдено</span>
			</div>
		</div>

		<!-- Правая панель - содержимое выбранной вкладки -->
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
					<slot name="content"
					:data="data"
					:list-tabs="listTabs"
					></slot>
				</template>
			</ListTabsFrame>
			<div v-else class="empty-state">
				<p>Выберите вкладку для просмотра</p>
			</div>
		</div>
	</div>
</template>

<script lang="tsx">
import ListTabsFrame from "./ListTabsFrame.vue";
import type { Tab } from "@/tabs/tabs.ts";
import { RecordSchema } from "@/types/fields/fields.ts";
import type { PropType, Component } from "vue";
import { type ClassType } from "@/utils/classUtils.ts";
import { type dataStoreType } from "@/stores/dataStore.ts";
import { useDataStore } from "@/stores/dataStore.ts";

export default {
	name: "TabListBox",

	components: {
		ListTabsFrame,
	},

	inject: {
		frameNavigator: {
			from: 'frameNavigator',
			default: null,
		},
	},

	data(): {
		activeTab: string | null;
		searchQuery: string;
	} {
		return {
			activeTab: null,
			searchQuery: "",
		};
	},

	props: {
		tabs: {
			type: Array as PropType<Tab[]>,
			required: true,
			default: () => [],
		},
		schemaType: {
			type: Object as PropType<ClassType<RecordSchema>>
		},
		fileData: {
			type: Object as PropType<dataStoreType<RecordSchema>>
		},
		// ✅ Новый проп для включения поиска
		isSearch: {
			type: Boolean,
			default: false,
		},
		// ✅ Кастомный placeholder для поиска
		searchPlaceholder: {
			type: String,
			default: "Поиск вкладок...",
		},
		// ✅ Чувствительность к регистру
		caseSensitive: {
			type: Boolean,
			default: false,
		},
		// ✅ Поиск по всем полям (не только label)
		searchFields: {
			type: Array as PropType<Array<keyof Tab>>,
			default: () => ['label', 'id'],
		},
	},

	computed: {
		currentTab(): Tab | undefined {
			return this.tabs.find((t) => t.id === this.activeTab);
		},

		// ✅ Отфильтрованные вкладки
		filteredTabs(): Tab[] {
			if (!this.isSearch || !this.searchQuery.trim()) {
				return this.tabs;
			}

			const query = this.caseSensitive 
				? this.searchQuery.trim() 
				: this.searchQuery.trim().toLowerCase();

			return this.tabs.filter((tab) => {
				return this.searchFields.some((field) => {
					const value = tab[field];
					if (value === undefined || value === null) return false;
					
					const stringValue = String(value);
					const searchValue = this.caseSensitive 
						? stringValue 
						: stringValue.toLowerCase();
					
					return searchValue.includes(query);
				});
			});
		},
	},

	methods: {
		deleteCurrentTab() {
			const currentTab = this.currentTab
			const dataStore = useDataStore()

			if (currentTab?.dataStoreId) {
				const data = dataStore.getMap(currentTab.dataStoreId)
				
				data.delete(currentTab?.id)
				this.closeTab()
			}
			
			
		},

		createNewSchema() {
			if (!this.fileData || !this.schemaType) return;

			const newInstance =	new this.schemaType()
			const newInstanceId = newInstance.getId()

			if (newInstanceId) {
				this.fileData.set(newInstanceId, newInstance)
				this.selectTab(newInstanceId)
			}
		},

		selectTab(tabId: string) {
			if (this.isTabVisible(tabId)) {
				if (this.activeTab !== tabId) {
					(this as any).frameNavigator?.goRoot?.();
				}
				this.activeTab = tabId;
				localStorage.setItem("activeTab", tabId);
				this.$emit("tab-selected", tabId);
			}
		},

		refreshTab() {
			this.$emit("refresh", this.activeTab);
		},

		closeTab() {
			this.activeTab = null;
			localStorage.removeItem("activeTab");
		},

		handleContentUpdate(data: any) {
			this.$emit("content-update", data);
		},

		// ✅ Проверка видимости вкладки
		isTabVisible(tabId: string): boolean {
			if (!this.isSearch || !this.searchQuery.trim()) {
				return true;
			}
			return this.filteredTabs.some(t => t.id === tabId);
		},

		// ✅ Обработка поиска
		handleSearch() {
			// Если активная вкладка скрыта поиском, выбираем первую найденную
			if (this.activeTab && !this.isTabVisible(this.activeTab)) {
				if (this.filteredTabs.length > 0) {
					this.selectTab(this.filteredTabs[0]?.id ?? "");
				} else {
					this.activeTab = null;
				}
			}
			this.$emit("search", this.searchQuery);
		},

		// ✅ Очистка поиска
		clearSearch() {
			this.searchQuery = "";
			this.handleSearch();
			// Фокус на поле ввода
			this.$nextTick(() => {
				const input = this.$refs.searchInput as HTMLInputElement;
				if (input) input.focus();
			});
		},

		// ✅ Подсветка совпадений
		highlightMatch(text: string): Component {
			if (!this.isSearch || !this.searchQuery.trim() || !text) {
				return <span>{text}</span>;
			}

			const query = this.caseSensitive 
				? this.searchQuery.trim() 
				: this.searchQuery.trim().toLowerCase();
			
			const searchText = this.caseSensitive ? text : text.toLowerCase();
			const index = searchText.indexOf(query);

			if (index === -1) return <span>{text}</span>;

			const before = text.substring(0, index);
			const match = text.substring(index, index + query.length);
			const after = text.substring(index + query.length);

			return <span>
				{before}
				<span class="search-highlight">
					{match}
				</span>
				{after}
			</span>;
		},
	},

	mounted() {
		const savedTab = localStorage.getItem("activeTab");
		if (savedTab && this.tabs.some((t) => t.id === savedTab)) {
			this.activeTab = savedTab;
		} else if (this.tabs.length > 0) {
			this.activeTab = this.tabs[0]?.id || null;
		}
	},

	// watch: {
	// 	tabs: {
	// 		handler(newTabs) {
	// 			if (this.activeTab && !newTabs.some((t: any) => t.id === this.activeTab)) {
	// 				if (newTabs.length > 0) {
	// 					this.activeTab = newTabs[0].id;
	// 				} else {
	// 					this.activeTab = null;
	// 				}
	// 			}
	// 		},
	// 		// deep: true,
	// 	},
	// },
};
</script>

<style scoped>
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

/* ===== ЛЕВАЯ ПАНЕЛЬ ===== */
.tab-list {
	width: 220px;
	min-width: 180px;
	background: #2d2d2d;
	padding: 8px 0;
	border-right: 1px solid #3d3d3d;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex-shrink: 0;
}

/* ===== ПОИСК ===== */
.search-container {
	padding: 0 12px 8px 12px;
	border-bottom: 1px solid #3d3d3d;
	margin-bottom: 4px;
	flex-shrink: 0;
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

/* ===== ЭЛЕМЕНТ ВКЛАДКИ ===== */
.tab-item {
	display: flex;
	align-items: center;
	padding: 10px 14px;
	cursor: pointer;
	transition: all 0.2s ease;
	border-left: 3px solid transparent;
	gap: 8px;
	user-select: none;
	word-wrap: break-word;
	word-break: break-word;
	overflow-wrap: break-word;
	min-height: 36px;
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
	text-align: center;
	flex-shrink: 0;
}

.tab-item .tab-label {
	flex: 1;
	font-size: 14px;
	font-weight: 500;
	line-height: 1.4;
	word-break: break-word;
	overflow-wrap: break-word;
	min-width: 0;
}

/* ✅ Подсветка поиска */
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
}

.no-results-icon {
	font-size: 32px;
	opacity: 0.5;
}

/* ===== ПРАВАЯ ПАНЕЛЬ ===== */
.tab-content {
	flex: 1;
	padding: 20px;
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

/* ===== СКРОЛЛ ===== */
.tab-list::-webkit-scrollbar {
	width: 6px;
}

.tab-list::-webkit-scrollbar-track {
	background: #2d2d2d;
}

.tab-list::-webkit-scrollbar-thumb {
	background: #555;
	border-radius: 3px;
}

.tab-list::-webkit-scrollbar-thumb:hover {
	background: #666;
}
</style>