// src/utils/navigation.ts

import { RecordSchema, castByArrayItemSchema, castByArrayItemSchemaInField, castByNestedSchemaInField, castToRecordSchema, isNotRecordSchemaButObject, type arrayItemSchemaType, type recordSchemaOtherData } from "@/types/fields/fields";
import type { Tab } from "@/tabs/tabs.ts";
import { LogAllMethods } from "@/utils/debug/debug";

export interface NavigatorOptions {
	tab: Tab;
}

export interface PathItem {
	key: string | number;
	type: 'object' | 'array' | 'record';
	value: any;

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

// @LogAllMethods('info')
export class Navigator {
	private _tab: Tab;
	private _pathStack: PathItem[] = [];

	constructor(options: NavigatorOptions) {
		this._tab = options.tab;
	}

	get tab(): Tab {
		return this._tab;
	}

	set tab(value: Tab) {
		this._tab = value;

		const oldPathStack = this._pathStack;
		this._pathStack = [];

		this.navigate(oldPathStack.map((el) => el.key))
	}

	get pathStack(): PathItem[] {
		return this._pathStack;
	}

	get sourceData(): RecordSchema | undefined {
		return castToRecordSchema(this._tab.data) ?? undefined;
	}

	get displayData(): any {
		if (this._pathStack.length === 0) {
			return this.sourceData;
		}
		return this._pathStack[this._pathStack.length - 1]?.schema
		?? this._pathStack[this._pathStack.length - 1]?.value;
	}

	getPathKeys(): string[] {
		return this._pathStack.map(item => String(item.key));
	}

	getPathItem(index: number): PathItem | undefined {
		return this._pathStack[index];
	}

	getCurrentSchema(): RecordSchema | undefined {
		return this.displayData;
	}

	changeCurrentSchema(newSchema: RecordSchema): void {
		if (this._pathStack.length === 0) {
			this._tab.data = newSchema as any;
			return;
		}

		const oldPathItem = this._pathStack[this._pathStack.length - 1];
		
		if (oldPathItem && oldPathItem.schema instanceof RecordSchema) {
			this._pathStack[this._pathStack.length - 1] = {
				...oldPathItem,
				value: newSchema.data,
				schema: newSchema,
			}
		}
	}

	navigate(key: any): boolean {
		if (Array.isArray(key)) {
			for (const _key of key) {
				if (this.navigate(_key) === false)
					return false;
			}
			return true;
		}

		const currentData = this.displayData;
		if (!currentData) return false;

		const field = (
			currentData instanceof RecordSchema
			? currentData?.getFieldByKey(key) 
			: null
		);
		const lastPathItem: PathItem | undefined = this._pathStack.at(-1)

		let target: any;

		if (typeof currentData === 'object') {
			if (currentData instanceof RecordSchema) {
				target = currentData.get(key);
			} else {
				target = currentData[key];
			}
		} else if (Array.isArray(currentData)) {
			const idx = typeof key === 'number' ? key : parseInt(key);
			if (isNaN(idx) || idx < 0 || idx >= currentData.length) return false;
			target = currentData[idx];
		} else {
			return false;
		}

		if (isNavigable(target)) {
			if (Array.isArray(target)) {
				this._pathStack.push({
					key: key,
					type: 'array',
					value: target,
					arrayItemSchema: field?.arrayItemSchema,
				});
			} else if (typeof target === 'object') {
				let schema = null;
				if (lastPathItem?.arrayItemSchema) {
					schema = castByArrayItemSchema(
						target,
						lastPathItem.arrayItemSchema
					)
				} else if (field?.nestedSchema) {
					schema = castToRecordSchema(
						target,
						field.nestedSchema
					)
				} else {
					schema = castToRecordSchema(target)
				}
				this._pathStack.push({
					key,
					schema,
					type: 'record',
					value: target
				});
			}
			return true
		}
		return false
	}

	goBack(): void {
		this._pathStack.pop();
		while (
			Array.isArray(this._pathStack.at(-1)?.value)
		) {
			this._pathStack.pop();
		}
	}

	goRoot(): void {
		this._pathStack = [];
	}

	jumpToLevel(index: number): void {
		if (index >= 0 && index < this._pathStack.length) {
			this._pathStack = this._pathStack.slice(0, index + 1);
		}
	}

	reset(): void {
		this._pathStack = [];
	}

	getPathStack(): PathItem[] {
		return [...this._pathStack];
	}

	getDisplayData(): RecordSchema | undefined {
		return this.displayData;
	}
}