<template>
	<div class="tab-frame">
		<div
			v-if="tab.title || pathStack.length > 0"
			class="frame-header"
		>
			<div class="frame-header-left">
				<h3 v-if="tab.title">{{ tab.title }}</h3>

				<!-- Хлебные крошки -->
				<div v-if="pathStack.length > 0" class="frame-breadcrumbs">
					<button class="back-btn" @click="goBack" title="Назад">←</button>
					<span class="breadcrumbs-path">
						<span class="breadcrumb-root" @click="goRoot">root</span>
						<span v-for="(segment, i) in pathStack" :key="i">
							<span class="breadcrumb-separator"> / </span>
							<span class="breadcrumb-item" @click="jumpToLevel(i)">{{
								segment
							}}</span>
						</span>
					</span>
				</div>
			</div>

			<div class="frame-actions">
				<button @click="handleRefresh" title="Обновить">⟳</button>
				<button @click="handleClose" title="Закрыть">✕</button>
			</div>
		</div>

		<div class="frame-body">
			<component
				v-if="tab.component"
				:is="tab.component"
				v-bind="tab.props || {}"
				:data="displayData"
				@update="handleUpdate"
			/>
			<div v-else-if="displayData">
				<slot name="content" :data="displayData"></slot>
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
import type { PropType } from "vue";
import type { Tab } from "@/tabs/tabs.ts";

export default {
	name: "ListTabsFrame",

	provide() {
		return {
			frameNavigator: {
				navigate: (key: string) => this.navigateToKey(key),
				goBack: () => this.goBack(),
				goRoot: () => this.goRoot(),
			},
		};
	},

	emits: {
		refresh: () => true,
		close: () => true,
		update: (data: any) => typeof data === "object" && data !== null,
	},

	props: {
		tab: {
			type: Object as PropType<Tab>,
			required: true,
		},
	},

	data(): {
		pathStack: string[];
	} {
		return {
			pathStack: [],
		};
	},

	computed: {
		sourceData(): Record<string, any> | undefined {
			return this.tab.data ?? undefined;
		},

		displayData(): Record<string, any> | undefined {
			if (!this.sourceData) return undefined;
			let current: any = this.sourceData;
			for (const key of this.pathStack) {
				if (
					current &&
					typeof current === "object" &&
					!Array.isArray(current) &&
					key in current
				) {
					current = current[key];
				} else {
					return undefined;
				}
			}
			return current;
		},
	},

	watch: {
		"tab.id"() {
			this.pathStack = [];
		},
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

		isNavigable(value: any): boolean {
			return (
				value !== null &&
				typeof value === "object" &&
				!Array.isArray(value)
			);
		},

		navigateToKey(key: string) {
			const target = this.displayData?.[key];
			if (this.isNavigable(target)) {
				this.pathStack.push(key);
			}
		},

		goBack() {
			this.pathStack.pop();
		},

		goRoot() {
			this.pathStack = [];
		},

		jumpToLevel(index: number) {
			this.pathStack = this.pathStack.slice(0, index + 1);
		},
	},
};
</script>

<style scoped>
.tab-frame {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: #2a2a2a;
	border-radius: 6px;
	outline: 1px solid #3d3d3d;
	overflow: hidden;
}

.frame-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 3px 9px;
	background: #413c25;
	border-bottom: 1px solid #3d3d3d;
	gap: 12px;
}

.frame-header-left {
	display: flex;
	align-items: center;
	gap: 12px;
	flex: 1;
	min-width: 0;
	flex-wrap: wrap;
}

.frame-header h3 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: #e8e8e8;
	flex-shrink: 0;
}

/* ===== Хлебные крошки ===== */
.frame-breadcrumbs {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	flex-wrap: wrap;
}

.back-btn {
	background: #3d3d3d;
	border: 1px solid #4a4a4a;
	color: #e0e0e0;
	padding: 2px 8px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	transition: all 0.2s;
}

.back-btn:hover {
	background: #4a4a4a;
	border-color: #42b883;
}

.breadcrumbs-path {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 2px;
	color: #999;
}

.breadcrumb-root {
	cursor: pointer;
	color: #42b883;
	font-weight: 500;
}

.breadcrumb-root:hover {
	text-decoration: underline;
}

.breadcrumb-item {
	cursor: pointer;
	color: #42b883;
	transition: color 0.2s;
}

.breadcrumb-item:hover {
	color: #66d9a0;
	text-decoration: underline;
}

.breadcrumb-separator {
	color: #666;
	margin: 0 2px;
}

/* ===== Действия ===== */
.frame-actions {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

.frame-actions button {
	background: transparent;
	border: none;
	color: #999;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 16px;
	transition: all 0.2s;
}

.frame-actions button:hover {
	background: #4a4a4a;
	color: #fff;
}

.frame-body {
	flex: 1;
	padding: 16px;
	overflow: auto;
}

.empty-state {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
	color: #666;
	font-size: 16px;
}
</style>