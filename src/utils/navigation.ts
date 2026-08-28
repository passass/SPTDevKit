// src/utils/navigation.ts
import { RecordSchema, castByArrayItemSchema, castToRecordSchema, type arrayItemSchemaType, type recordSchemaOtherData } from "@/types/fields/fields";
import type { Tab } from "@/tabs/tabs.ts";

export interface NavigatorOptions { tab: Tab; }

export interface PathItem {
    key: string | number;
    type: 'object' | 'array' | 'record';
    value: any;
	label?: string | null;
    schema?: RecordSchema | null;
    arrayItemSchema?: arrayItemSchemaType | null;
}

export function isNavigable(value: any): boolean {
	return (
		value !== null &&
		(
			typeof value === "object" ||
			Array.isArray(value) ||
			value instanceof RecordSchema
		)
	);
}
export class Navigator {
    private _tab: Tab;
    pathStack: PathItem[];

    constructor(options: NavigatorOptions) {
        this._tab = options.tab;
        this.pathStack = new Array();
    }

    get tab(): Tab { return this._tab; }
    set tab(value: Tab) {
        this._tab = value;
        const oldPathStack = this.pathStack.map(el => el.key);
        this.pathStack = [];
        this.navigate(oldPathStack);
    }
    
    get sourceData(): RecordSchema | undefined {
        return castToRecordSchema(this._tab.data) ?? undefined;
    }

    get displayData(): any {
        if (this.pathStack.length === 0) return this.sourceData;
        const last = this.pathStack[this.pathStack.length - 1];
        return last?.schema ?? last?.value;
    }

    getPathKeys(): string[] { return this.pathStack.map(item => String(item.key)); }
    getPathItem(index: number): PathItem | undefined { return this.pathStack[index]; }
    getCurrentSchema(): RecordSchema | undefined { return this.displayData; }

    changeCurrentSchema(newSchema: RecordSchema): void {
        if (this.pathStack.length === 0) {
            this._tab.data = newSchema as any;
            return;
        }
        const last = this.pathStack[this.pathStack.length - 1];
        if (last?.schema instanceof RecordSchema) {
            last.value = newSchema.data;
            last.schema = newSchema;
        }
    }

    navigate(key: any): boolean {
        if (Array.isArray(key)) {
            return key.every(k => this.navigate(k));
        }

        const currentData = this.displayData;
        if (!currentData) return false;

        const field = currentData instanceof RecordSchema ? currentData.getFieldByKey(key) : null;
        
		const lastPathItem = this.pathStack[this.pathStack.length-1];
		const label = field?.label

        let target: any;
        if (currentData instanceof RecordSchema) {
            target = currentData.get(key);
        } else if (Array.isArray(currentData)) {
            const idx = typeof key === 'number' ? key : parseInt(key);
            if (isNaN(idx) || idx < 0 || idx >= currentData.length) return false;
            target = currentData[idx];
        } else {
            target = currentData[key];
        }

        if (!isNavigable(target)) return false;

        if (Array.isArray(target)) {
            this.pathStack.push({ key, type: 'array', label: label, value: target, arrayItemSchema: field?.arrayItemSchema });
        } else if (typeof target === 'object') {
            let schema: RecordSchema | null = null;
            if (lastPathItem?.arrayItemSchema) {
                schema = castByArrayItemSchema(target, lastPathItem.arrayItemSchema);
            } else if (field?.nestedSchema) {
                schema = castToRecordSchema(target, field.nestedSchema);
            } else {
                schema = castToRecordSchema(target);
            }
            this.pathStack.push({
				key
				, schema
				, type: 'record'
				, value: target
				, label: label
			});
        }
        
        return true;
    }

    goBack(): void {
        this.pathStack.pop();
        while (Array.isArray(this.pathStack[this.pathStack.length-1]?.value)) {
            this.pathStack.pop();
        }
    }

    goRoot(): void { this.pathStack = []; }
    
    jumpToLevel(index: number): void {
        if (index >= 0 && index < this.pathStack.length) {
            this.pathStack = this.pathStack.slice(0, index + 1);
        }
    }

    reset(): void { this.pathStack = []; }
    getPathStack(): PathItem[] { return this.pathStack; }
    getDisplayData(): RecordSchema | undefined { return this.displayData; }
}