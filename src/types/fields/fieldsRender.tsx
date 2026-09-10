// src/types/fields/fieldsRender.tsx
import LoadWeaponBuildInput from "@/components/inputs/LoadWeaponBuildInput.vue";
import LocalizationInput from "@/components/inputs/LocalizationInput.vue";
import AdvancedSelectInput from "@/components/inputs/AdvancedSelectInput.vue";
import CompareInput from "@/components/inputs/CompareInput.vue";
import ParentInput from "@/components/inputs/ParentInput.vue";
import OptionsInput from "@/components/inputs/OptionsInput.vue";
import ArrayInput from "@/components/inputs/ArrayInput.vue";
import CompactObjectInput from "@/components/inputs/CompactObjectInput.vue";
import { Field, resolveDefaultValue, type SchemaData, type SchemaValue } from "@/types/fields/fields";
import { type WeaponBuildItem } from "@/stores/profileStore";
import { type Component, h, defineComponent, ref, toRaw } from "vue";
import { gameLocalization } from "@/types/localization";
import { RecordSchema } from "@/types/fields/fields";
import { type FieldContext } from "./fieldsConsts";
import type { Navigator } from "@/utils/navigation";

interface RenderRule {
    condition: (field: Field, recordSchema: RecordSchema) => boolean;
    component?: (field: Field, recordSchema: RecordSchema, handleNavigate: (key: any) => void) => Component;
    componentTemplate?: Component | string;
    componentTemplateProps?: Record<string, any>;
    hasOnInputEmit?: boolean;
    hasOnChangeEmit?: boolean;
}

function getObjectSummary(value: SchemaValue): string {
    if (!value) return "{}";
    const keys = value instanceof RecordSchema ? Object.keys(value.data) : Object.keys(value);
    if (keys.length === 0) return "{}";
    const previewKeys = keys.slice(0, 3);
    const translatedKeys = previewKeys.map((key) => {
        const translated = gameLocalization.getUIText({
            localeId: key,
            default: key,
        });
        return translated;
    });
    const preview = translatedKeys.join(", ");
    return keys.length > 3 ? `{ ${preview}... (${keys.length} полей) }` : `{ ${preview} }`;
}

function hasCompareInput(recordSchema: RecordSchema): boolean {
    return recordSchema.getFieldByKey("compareMethod") && recordSchema.getFieldByKey("value");
}

const compareInputFields: string[] = ["compareMethod", "value"];

function isCompareInput(field: Field): boolean {
    return (
        field.nestedSchema &&
        (field.nestedSchema as any)?.fields?.length === 2 &&
        (field.nestedSchema as any)?.getFieldByKeyStatic("compareMethod") &&
        (field.nestedSchema as any)?.getFieldByKeyStatic("value")
    );
}

function getRewardDisplay(items: WeaponBuildItem[]): string {
    const rootItems = items.filter((item) => !item.parentId);
    if (rootItems.length === 0) return "";
    const grouped: Record<string, { tpl: string; count: number }> = {};
    for (const item of rootItems) {
        const tpl = item._tpl;
        if (!grouped[tpl]) grouped[tpl] = { tpl, count: 0 };
        grouped[tpl].count += Number(item?.upd?.StackObjectsCount ?? 1);;
    }
    const parts: string[] = [];
    for (const [tpl, data] of Object.entries(grouped)) {
        const name = gameLocalization.getObjectLocalization({ instance: { _id: tpl } });
        const count = data.count;
        const display = count > 1 ? `${name} x ${count}` : name;
        parts.push(display);
    }
    return parts.join(", ");
}

// Обертки для изоляции реактивности значений полей от внешнего computed(vnodes)
const FieldTemplateWrapper = defineComponent({
    name: "FieldTemplateWrapper",
    props: ["recordSchema", "field", "fieldContext", "componentTemplate", "componentTemplateProps", "eventHandlers", "extraProps"],
    setup(props, { expose }) {
        const innerRef = ref<any>(null);

        expose({
            getSavedData() {
                if (innerRef.value && typeof innerRef.value.getSavedData === "function") {
                    return innerRef.value.getSavedData();
                }
                return undefined;
            },
        });

		return () => {
			let initValue = props.recordSchema.get(props.field);

			if (initValue === undefined) {
                initValue = resolveDefaultValue(props.field, props.recordSchema.getData());
                props.fieldContext.value = initValue;
			}

			return h(props.componentTemplate as any, {
                ref: innerRef,
                key: props.field.key,
                field: props.field,
                recordSchema: props.recordSchema,
                data: props.recordSchema.data,
                placeholder: props.field.placeholder,
                disabled: !props.field.editable,
                modelValue: initValue,
                value: initValue,
                checked: initValue,
				"v-model": initValue,

				fieldContext: props.fieldContext,
				...(props.extraProps ?? {}),
                ...(props.eventHandlers ?? {}),
                ...(props.componentTemplateProps ?? {}),
            });
        };
    },
});

const FieldComponentWrapper = defineComponent({
    name: "FieldComponentWrapper",
    props: ["recordSchema", "field", "handleNavigate", "componentFunc"],
    setup(props) {
        return () => {
            const vnode = props.componentFunc(props.field, props.recordSchema, props.handleNavigate);
            if (vnode && typeof vnode === "object" && !Array.isArray(vnode) && !(vnode as any).key) {
                (vnode as any).key = props.field.key;
            }
            return vnode;
        };
    },
});

const renderRules: RenderRule[] = [
    {
        condition: (field: Field) => field.type === "localization",
        componentTemplate: LocalizationInput,
    },
    {
        condition: (field: Field) => field.type === "advancedSelect",
        componentTemplate: AdvancedSelectInput,
    },
    {
        condition: (field: Field) => isCompareInput(field),
        componentTemplate: CompareInput,
    },
    {
        condition: (field: Field) => field.key === "parentId",
        componentTemplate: ParentInput,
    },
    {
        condition: (field: Field, recordSchema: RecordSchema) =>
            compareInputFields.includes(field.key) && hasCompareInput(recordSchema),
        component: (field: Field, recordSchema: RecordSchema) => {
            if (field.key === "value") {
                return (
                    <div>
                        <CompareInput data={recordSchema.data} />
                    </div>
                );
            }
            return <></>;
        },
    },
    {
        condition: (field: Field, recordSchema: RecordSchema) => !!(field.type === "text" || field.hidden),
        componentTemplate: "input",
        componentTemplateProps: { type: "text" },
        hasOnInputEmit: true,
    },
    {
        condition: (field: Field, recordSchema: RecordSchema) => field.type === "number",
        componentTemplate: "input",
        componentTemplateProps: { type: "number" },
        hasOnInputEmit: true,
    },
    {
        condition: (field: Field) => field.type === "boolean",
        componentTemplate: "input",
        componentTemplateProps: { type: "checkbox" },
        hasOnChangeEmit: true,
    },
    {
        condition: (field: Field) => field.type === "textarea",
        componentTemplate: "textarea",
        componentTemplateProps: { rows: 3 },
        hasOnInputEmit: true,
    },
    {
        condition: (field: Field) => field.type === "select",
        componentTemplate: OptionsInput,
    },
    {
        condition: (field: Field) => field.isArray(),
        componentTemplate: ArrayInput,
    },
    {
        condition: (field: Field, recordSchema: RecordSchema) => {
        	if (!field.nestedSchema) return false;
			const isAllPrimitives = (field.nestedSchema as typeof RecordSchema)
                .fields
                .every((f) => f.type !== "object" && !f.isArray() && !f.nestedSchema && !f.arrayItemSchema);
            return field.type === "object" && isAllPrimitives;
        },
        componentTemplate: CompactObjectInput,
    },
    {
        condition: (field: Field) => field.type === "object",
        component: (field: Field, recordSchema: RecordSchema, handleNavigate: (key: any) => void) => (
			<div class="object-summary" onClick={() => handleNavigate(field.key)}>{
				recordSchema.get(field) ? getObjectSummary(recordSchema.get(field)) : ""
			}</div>
        ),
    },
];

const extraRenderRules: RenderRule[] = [
    {
        condition: (field: Field, recordSchema: RecordSchema) => field.key === "items" && field.isArray(),
        component: (field: Field, recordSchema: RecordSchema) => (
            <>
                <LoadWeaponBuildInput field={field} data={recordSchema.getData()} />
                {(recordSchema.get(field.key) as unknown as WeaponBuildItem[])?.filter((item: WeaponBuildItem) => !item.parentId).length > 0 && (
                    <div class="weapon-build-reward">
                        <span class="weapon-build-reward__label">Предметы:</span>
                        <span class="weapon-build-reward__value">{getRewardDisplay(recordSchema.get(field.key) as unknown as WeaponBuildItem[])}</span>
                    </div>
                )}
            </>
        ),
    },
];

export interface fieldRenderParams {
    recordSchema: RecordSchema;
    field: Field;
    exactRenderRules?: RenderRule[];
    extraProps?: Record<string, any>;
    handleNavigate?: Navigator["navigate"];
}

export function extraFieldRender({ recordSchema, field }: fieldRenderParams) {
    return fieldRender({ recordSchema, field, exactRenderRules: extraRenderRules });
}

export function fieldRender({
	recordSchema,
	field,
	exactRenderRules,
	handleNavigate,
	extraProps,
}: fieldRenderParams): Component | undefined {
    for (const renderRule of exactRenderRules ?? renderRules) {
        if (renderRule.condition(field, recordSchema)) {
            if (renderRule.componentTemplate) {
                const OnInput = (e: Event): void => {
                    if (field.virtual) return;
                    recordSchema.set(field, (e.target as HTMLInputElement)?.value);
                };
                const OnChange = (e: Event): void => {
                    if (field.virtual) return;
                    const target = e.target as HTMLInputElement;
                    if (target.type === "checkbox") {
                        recordSchema.set(field, target.checked);
                    } else {
                        recordSchema.set(field, target.value);
                    }
                };
				const OnModelValueInput = (val: any): void => {
                    if (field.onUpdateModelValue) field.onUpdateModelValue(recordSchema, val);
                    if (!field.virtual) recordSchema.set(field, val);
                };

                const eventHandlers: Record<string, any> = {
                    "onUpdate:modelValue": OnModelValueInput,
                    onNavigate: handleNavigate,
                    navigateHandler: handleNavigate,
                };

                if (renderRule.hasOnInputEmit) eventHandlers.onInput = OnInput;
				if (renderRule.hasOnChangeEmit) eventHandlers.onChange = OnChange;

				const fieldContext: FieldContext = {
					field,
					value: recordSchema.get(field),
					recordSchema,
					data: recordSchema.getData(),
					navigate: handleNavigate ?? (() => false),
				};

				return h(FieldTemplateWrapper, {
                    recordSchema,
					field,
                    fieldContext,
                    componentTemplate: renderRule.componentTemplate,
                    componentTemplateProps: renderRule.componentTemplateProps,
                    eventHandlers,
                    extraProps,
                });
            }
            if (renderRule.component) {
                return h(FieldComponentWrapper, {
                    recordSchema, // Передаем оригинальный
                    field,
                    handleNavigate,
                    componentFunc: renderRule.component,
                });
            }
        }
    }
}
