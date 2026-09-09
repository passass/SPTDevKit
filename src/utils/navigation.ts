// src/utils/navigation.ts
import { RecordSchema, castToRecordSchema, type arrayItemSchemaType } from "@/types/fields/fields";
import type { Tab } from "@/tabs/tabs.ts";
import { nextTick, type Component } from "vue";

export interface NavigatorOptions {
    tab: Tab;
}

export interface PathItem {
    key: string | number;
    type: "object" | "array" | "record";
    value?: Record<string, any> | Array<object>;
    label?: string | null;
    schema?: RecordSchema | null;
    arrayItemSchema?: arrayItemSchemaType | null;

    lastScrollPosition?: ScrollPosition;
    lastSavedData?: Map<string, any>;
}

export function isNavigable(value: any): boolean {
    return value !== null && (typeof value === "object" || Array.isArray(value) || value instanceof RecordSchema);
}

interface ScrollPosition {
    scrollLeft: number;
    scrollTop: number;
}

export class Navigator {
	tab!: Tab;
    sourcePathItem!: PathItem;
    pathStack!: PathItem[];
    container?: HTMLElement;

    constructor(options: NavigatorOptions) {
		this.setTab(options.tab)
	}

	setTab(tab: Tab) {
		this.tab = tab;
		this.sourcePathItem = {
			key: 0
			, type: "record"
		};
		this.pathStack = new Array();
	}

	get sourceData(): RecordSchema | undefined {
        return castToRecordSchema(this.tab.data) ?? undefined;
    }

    get displayData(): RecordSchema | any {
        if (this.pathStack.length === 0) return this.sourceData;
        const last = this.pathStack[this.pathStack.length - 1];
        return last?.schema ?? last?.value;
    }

    getPathKeys(): string[] {
        return this.pathStack.map((item) => String(item.key));
	}
    getLastPathItem(): PathItem | undefined {
        return this.pathStack[this.pathStack.length - 1] ?? this.sourcePathItem;
    }
    getPathItem(index: number): PathItem | undefined {
        return this.pathStack[index];
    }
    getCurrentSchema(): RecordSchema | undefined {
        return this.displayData;
    }

    changeCurrentSchema(newSchema: RecordSchema): void {
        if (this.pathStack.length === 0) {
            this.tab.data = newSchema as any;
            return;
        }
        const last = this.pathStack[this.pathStack.length - 1];
        if (last?.schema instanceof RecordSchema) {
            last.value = newSchema.data;
            last.schema = newSchema;
        }
    }

	navigate(key: any, vnodes?: Map<string, Array<Component | undefined>>): boolean {
        if (Array.isArray(key)) {
            return key.every((k) => this.navigate(k, vnodes));
		}

		let lastScrollPosition: ScrollPosition | undefined;
        if (this.container) {
            lastScrollPosition = {
                scrollLeft: this.container.scrollLeft,
                scrollTop: this.container.scrollTop,
            };
        }

		if (key instanceof RecordSchema) {
			this.pathStack.push({
                key: key.constructor.name,
                type: "record",
                label: key.constructor.name,
                value: key.data,
                schema: key,
                lastScrollPosition: lastScrollPosition,
            });
			return true;
		}

		const currentData = this.displayData;
        if (!currentData) return false;

        const field = currentData instanceof RecordSchema ? currentData.getFieldByKey(key) : null;

        const lastPathItem: PathItem | undefined = this.getLastPathItem();
        const label = field?.label;

        let target: Record<string, any> | Array<object>;
        if (currentData instanceof RecordSchema) {
            target = currentData.get(key);
        } else if (Array.isArray(currentData)) {
            const idx = typeof key === "number" ? key : parseInt(key);
            if (isNaN(idx) || idx < 0 || idx >= currentData.length) return false;
            target = currentData[idx];
        } else {
            target = currentData[key];
        }

        if (!isNavigable(target)) return false;

		if (lastPathItem && vnodes) {
	        const lastSavedData = new Map<string, any>();
			for (const [fieldKey, vnode] of vnodes.entries()) {
				if ("getSavedData" in vnode && typeof vnode.getSavedData === "function") {
                    lastSavedData.set(fieldKey, vnode.getSavedData());
                }
            }
			lastPathItem.lastSavedData = lastSavedData;
        }

        if (Array.isArray(target)) {
            this.pathStack.push({
                key,
                type: "array",
                label: label,
                value: target,
                arrayItemSchema: field?.arrayItemSchema,
				lastScrollPosition: lastScrollPosition,
            });
            console.log("currentData", currentData, target)
        } else if (typeof target === "object") {
            let schema: RecordSchema | null = null;

            const parent = lastPathItem?.schema ?? lastPathItem?.value;
            schema = castToRecordSchema(target, lastPathItem?.arrayItemSchema ?? field?.nestedSchema, {
                parent: parent,
			});

            console.log("currentData", currentData)

            this.pathStack.push({
                key: key,
                schema: schema,
                type: "record",
                value: target,
                label: label,
                lastScrollPosition: lastScrollPosition,
            });
        }

        return true;
    }

    goBack(): void {
        let lastPathItem = this.pathStack.pop();
        while (Array.isArray(this.pathStack[this.pathStack.length - 1]?.value)) {
            lastPathItem = this.pathStack.pop();
        }
        const lastScrollPosition = lastPathItem?.lastScrollPosition;

        if (lastScrollPosition) {
            nextTick(() => {
                this.container?.scrollTo(lastScrollPosition.scrollLeft, lastScrollPosition.scrollTop);
            });
        }
    }

    goRoot(): void {
        this.pathStack = [];
    }

    jumpToLevel(index: number): void {
        if (index >= 0 && index < this.pathStack.length) {
            this.pathStack = this.pathStack.slice(0, index + 1);
        }
    }

    reset(): void {
        this.pathStack = [];
    }
    getPathStack(): PathItem[] {
        return this.pathStack;
    }
    getDisplayData(): RecordSchema | undefined {
        return this.displayData;
    }
}
