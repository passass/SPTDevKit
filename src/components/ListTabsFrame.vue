<!-- src/components/ListTabsFrame.vue -->

<template>
    <div class="tab-frame">
        <div v-if="tab.title || pathStack.length > 0" class="frame-header">
            <div class="frame-header-left">
                <h3 v-if="tab.title" class="frame-title">
                    <span v-if="tab.icon" class="frame-title-icon">{{ tab.icon }}</span>
                    <span class="frame-title-text">{{ tab.title }}</span>
                </h3>

                <!-- Хлебные крошки -->
                <div v-if="pathStack.length > 0" class="frame-breadcrumbs">
                    <button class="back-btn" @click="navigator?.goBack()" title="Назад">←</button>
                    <span class="breadcrumbs-path">
                        <span class="breadcrumb-root" @click="navigator?.goRoot()">{{ getRootTranslate }}</span>
                        <span v-for="(segment, i) in pathStack" :key="i">
                            <span class="breadcrumb-separator"> / </span>
                            <span
                                :class="{
                                    'breadcrumb-item': navigator?.getPathItem(i)?.type !== 'array',
                                }"
                                @click="navigator?.getPathItem(i)?.type !== 'array' && navigator?.jumpToLevel(i)"
                                >{{ getTranslatedPath(segment) }}</span
                            >
                        </span>
                    </span>
                </div>
            </div>

            <div class="frame-actions" v-if="hasCloseReloadButtons">
                <button @click="handleRefresh" title="Обновить">⟳</button>
                <button @click="handleClose" title="Закрыть">✕</button>
            </div>
        </div>

        <div class="frame-body" ref="container">
            <component
                v-if="tab.component"
                :is="tab.component"
                v-bind="tab.props || {}"
                :data="displayData"
                @update="handleUpdate"
            />
            <div v-else-if="displayData">
                <slot name="content" :data="displayData" :list-tabs="listTabs"></slot>
            </div>
            <div v-else class="empty-state">
                <slot name="empty">
                    <p>Нет данных для отображения</p>
                </slot>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { capitalize, type PropType } from "vue";
import type { Tab } from "@/tabs/tabs.ts";
import { Navigator, type PathItem } from "@/utils/navigation";
import { gameLocalization } from "@/types/localization";

export default {
    name: "ListTabsFrame",

    props: {
        tab: {
            type: Object as PropType<Tab>,
            required: true,
        },
        hasCloseReloadButtons: {
			type: Boolean,
            default: true,
        },
        listTabs: {
            type: Object,
        },
    },

    emits: {
        refresh: () => true,
        close: () => true,
        update: (data: any) => typeof data === "object" && data !== null,
    },

    data() {
        return {
            navigator: new Navigator({
                tab: this.tab,
            }),
        };
    },

    computed: {
        pathStack(): PathItem[] {
            return this.navigator?.getPathStack() ?? [];
        },

        getRootTranslate() {
            return capitalize(
                gameLocalization.getUIText({
                    localeId: "root",
                })
            );
        },

        displayData(): Record<string, any> | undefined {
            return this.navigator?.getDisplayData();
        },
    },

    provide() {
        return {
            frameNavigator: this.navigator,
        };
    },

    watch: {
        tab: {
            handler(newTab: Tab) {
                if (this.navigator && this.navigator.tab.id !== newTab.id) {
                    this.navigator.goRoot();
                    this.navigator.tab = newTab;
                }
            },
            deep: false,
        },
    },

    mounted() {
        this.navigator.container = this.$refs.container as HTMLElement;
    },

    methods: {
        handleRefresh() {
            this.$emit("refresh");
        },

        handleClose() {
            this.$emit("close");
        },

        handleUpdate(data: any) {
            this.$emit("update", data);
        },

        getTranslatedPath(segment: PathItem): string {
            const key = String(segment.key);
            const translated = gameLocalization.getUIText({
                localeId: key,
                default: segment.label ?? key,
            });
            return translated;
        },
    },
};
</script>

<style scoped>
.tab-frame {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(145deg, #1e1e2a 0%, #2a2a3a 100%);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    outline: 1px solid rgba(255, 255, 255, 0.05);
}

/* ===== УМЕНЬШЕННЫЙ ХЕДЕР ===== */
.frame-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 12px; /* было 8px 16px */
    background: rgba(30, 30, 46, 0.8);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    gap: 8px; /* было 12px */
    flex-shrink: 0;
    min-height: 36px; /* задаём минимальную высоту для аккуратности */
}

.frame-header-left {
    display: flex;
    align-items: center;
    gap: 8px; /* было 12px */
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
}

/* Заголовок */
.frame-title {
    display: flex;
    align-items: center;
    gap: 6px; /* было 8px */
    margin: 0;
    font-size: 14px; /* было 16px */
    font-weight: 600;
    background: linear-gradient(135deg, #f0e6d0, #c0b8a8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.2px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
}

.frame-title-icon {
    font-size: 16px; /* было 20px */
    -webkit-text-fill-color: initial;
}

.frame-title-text {
    -webkit-text-fill-color: initial;
    color: #e8e0d0;
}

/* ===== Хлебные крошки (компактнее) ===== */
.frame-breadcrumbs {
    display: flex;
    align-items: center;
    gap: 4px; /* было 6px */
    font-size: 12px; /* было 13px */
    flex-wrap: wrap;
    padding: 2px 8px; /* было 4px 10px */
    background: rgba(0, 0, 0, 0.25);
    border-radius: 16px; /* было 20px */
    border: 1px solid rgba(255, 255, 255, 0.04);
}

.back-btn {
    background: rgba(255, 255, 255, 0.06);
    border: none;
    color: #b0a8a0;
    padding: 0 8px; /* было 2px 10px */
    border-radius: 14px; /* было 16px */
    cursor: pointer;
    font-size: 13px; /* было 14px */
    transition: all 0.2s ease;
    line-height: 1.6; /* было 1.8 */
}

.back-btn:hover {
    background: rgba(66, 184, 131, 0.2);
    color: #66d9a0;
    transform: scale(1.05);
}

.breadcrumbs-path {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px;
    color: #999;
}

.breadcrumb-root {
    display: flex;
    align-items: center;
    gap: 3px; /* было 4px */
    cursor: pointer;
    color: #66d9a0;
    font-weight: 500;
    background: transparent;
    border: none;
    padding: 1px 4px; /* было 2px 6px */
    border-radius: 10px; /* было 12px */
    transition: all 0.2s;
}

.breadcrumb-root:hover {
    background: rgba(66, 184, 131, 0.15);
    text-decoration: none;
}

.breadcrumb-root-icon {
    font-size: 12px; /* было 14px */
}

.breadcrumb-item {
    cursor: pointer;
    color: #66d9a0;
    background: transparent;
    border: none;
    padding: 1px 4px; /* было 2px 6px */
    border-radius: 10px; /* было 12px */
    transition: all 0.2s;
}

.breadcrumb-item:hover {
    background: rgba(66, 184, 131, 0.15);
    color: #88eebb;
    text-decoration: none;
}

.breadcrumb-current {
    color: #d0c8b8;
    padding: 1px 4px; /* было 2px 6px */
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px; /* было 12px */
}

.breadcrumb-separator {
    color: #666;
    margin: 0 1px; /* было 0 2px */
    font-weight: 300;
}

.breadcrumb-label {
    white-space: nowrap;
    max-width: 140px; /* было 180px */
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ===== Действия (кнопки компактнее) ===== */
.frame-actions {
    display: flex;
    gap: 4px; /* было 6px */
    flex-shrink: 0;
}

.frame-actions button {
    background: rgba(255, 255, 255, 0.04);
    border: none;
    color: #aaa;
    cursor: pointer;
    width: 28px; /* было 32px */
    height: 28px; /* было 32px */
    border-radius: 50%;
    font-size: 16px; /* было 18px */
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
}

.frame-actions button:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    transform: scale(1.1);
}

.action-btn--refresh:hover {
    background: rgba(66, 184, 131, 0.25);
    color: #66d9a0;
    transform: rotate(60deg) scale(1.1);
}

.action-btn--close:hover {
    background: rgba(255, 70, 70, 0.2);
    color: #ff6b6b;
}

/* ===== Остальное без изменений ===== */
.frame-body {
    flex: 1;
    padding: 8px;
    overflow: auto;
    background: rgba(0, 0, 0, 0.2);
}

.frame-content {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    padding: 12px;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #666;
    font-size: 16px;
    font-style: italic;
}

.frame-body::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.frame-body::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
}
.frame-body::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 10px;
}
.frame-body::-webkit-scrollbar-thumb:hover {
    background: #777;
}
</style>
