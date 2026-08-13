<template>
	<div class="form-frame">
		<div v-if="title" class="form-frame__title">
			<h3>{{ title }}</h3>
		</div>

		<div class="form-frame__fields">
			<div
				v-for="field in displayFields"
				:key="field.key"
				class="form-field"
				:class="{ 'field-hidden': field.type === 'hidden' }"
			>
				<div class="form-field__header">
					<label :for="field.key">{{ field.label }}</label>
					<button
						v-if="field.isNavigable"
						class="navigate-btn"
						@click="handleNavigate(field.key)"
						title="Открыть вложенную структуру"
					>
						→
					</button>
				</div>

				<!-- text / hidden -->
				<input
					v-if="field.type === 'text' || field.type === 'hidden'"
					:id="field.key"
					v-model="getData[field.key]"
					type="text"
					:placeholder="field.placeholder"
					:disabled="!field.isEditable"
				/>

				<!-- number -->
				<input
					v-else-if="field.type === 'number'"
					:id="field.key"
					v-model.number="getData[field.key]"
					type="number"
					:placeholder="field.placeholder"
					:disabled="!field.isEditable"
				/>

				<!-- boolean -->
				<input
					v-else-if="field.type === 'boolean'"
					:id="field.key"
					v-model="getData[field.key]"
					type="checkbox"
					:disabled="!field.isEditable"
				/>

				<!-- textarea -->
				<textarea
					v-else-if="field.type === 'textarea'"
					:id="field.key"
					v-model="getData[field.key]"
					rows="3"
					:placeholder="field.placeholder"
					:disabled="!field.isEditable"
				></textarea>

				<!-- select -->
				<select
					v-else-if="field.type === 'select'"
					:id="field.key"
					v-model="getData[field.key]"
					:disabled="!field.isEditable"
				>
					<option
						v-for="option in field.options"
						:key="option"
						:value="option"
					>
						{{ option }}
					</option>
				</select>

				<!-- array -->
				<div v-else-if="field.type === 'array'" class="object-summary">
					{{ getArraySummary(field.value) }}
				</div>

				<!-- object -->
				<div v-else-if="field.type === 'object'" class="object-summary">
					{{ getObjectSummary(field.value) }}
				</div>

				<!-- Описание под полем -->
				<div v-if="field.description" class="field-description">
					{{ field.description }}
				</div>

				<!-- Ошибка валидации -->
				<div v-if="validationErrors[field.key]" class="field-error">
					{{ validationErrors[field.key] }}
				</div>
			</div>
		</div>

		<div v-if="$slots.actions" class="form-frame__actions">
			<slot name="actions"></slot>
		</div>
	</div>
</template>

<script lang="tsx">
import { inject, ref, watch, computed, reactive, toRefs } from "vue";
import { RecordSchema, type FieldType } from "@/types/fields";

interface DisplayField {
	key: string;
	label: string;
	type: FieldType | string;
	value: any;
	isNavigable: boolean;
	isEditable: boolean;
	placeholder: string;
	description: string;
	options?: any[];
}

export default {
	name: "RecordEditorInput",
	
	props: {
		data: {
			type: Object,
			required: true,
		},
		title: {
			type: String,
			default: "",
		},
		validate: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
		getData(): Record<string, any> {
			if (this.data instanceof RecordSchema)
				return this.data.data;
			return this.data;
		},
	},

	emits: {
		update: (data: any) => true,
		validation: (result: { valid: boolean; errors: Record<string, string> }) => true,
	},

	setup(props: any, { emit }: any) {
		const frameNavigator = inject<{ navigate?: (key: string) => void }>(
			"frameNavigator",
			{}
		);
		
		const validationErrors = ref<Record<string, string>>({});
		
		// Создаем реактивный объект для полей
		const fieldValues = reactive<Record<string, any>>({});

		// Валидация всех полей
		function validateAll() {
			const data = props.data;
			if (data instanceof RecordSchema) {
				const result = data.validate();
				validationErrors.value = result.errors;
				emit('validation', result);
				return result;
			}
			return { valid: true, errors: {} };
		}

		// Получаем displayFields
		const displayFields = computed<DisplayField[]>(() => {
			const data = props.data;
			const fields: DisplayField[] = [];

			if (data instanceof RecordSchema) {
				for (const item of data.getDisplayFields()) {
					const field = item.field;
					const displayField: DisplayField = {
						key: item.key,
						label: field?.label ?? data.getLabel(item.key),
						type: field?.type ?? data.resolveType(item.key),
						value: item.value,
						isNavigable: data.isNavigable(item.key),
						isEditable: data.isEditable(item.key),
						placeholder: data.getPlaceholder(item.key),
						description: data.getDescription(item.key),
						options: data.getOptions(item.key),
					};
					
					// Синхронизируем значения с fieldValues
					if (!(item.key in fieldValues)) {
						fieldValues[item.key] = item.value;
					}
					
					fields.push(displayField);
				}
				return fields;
			}

			// Fallback для обычных объектов
			if (data && typeof data === 'object') {
				for (const [key, value] of Object.entries(data)) {
					const displayField: DisplayField = {
						key,
						label: formatLabel(key),
						type: autoDetectType(value),
						value: value,
						isNavigable: isNavigableValue(value),
						isEditable: true,
						placeholder: "",
						description: "",
					};
					
					if (!(key in fieldValues)) {
						fieldValues[key] = value;
					}
					
					fields.push(displayField);
				}
			}

			return fields;
		});

		// Вспомогательные функции
		function autoDetectType(value: any): string {
			if (value === null || value === undefined) return 'text';
			if (Array.isArray(value)) return 'array';
			if (typeof value === 'boolean') return 'boolean';
			if (typeof value === 'number') return 'number';
			if (typeof value === 'string' && value.length > 100) return 'textarea';
			if (typeof value === 'object' || value instanceof RecordSchema) return 'object';
			return 'text';
		}
		
		function isNavigableValue(value: any): boolean {
			return (
				value !== null &&
				typeof value === 'object' &&
				!Array.isArray(value)
			);
		}
		
		function formatLabel(key: string): string {
			return key
				.replace(/([A-Z])/g, " $1")
				.replace(/_/g, " ")
				.replace(/^./, (str: string) => str.toUpperCase());
		}

		// Следим за изменениями data извне
		watch(
			() => props.data,
			(newData) => {
				if (newData instanceof RecordSchema) {
					// Обновляем fieldValues из новых данных
					const fields = newData.getDisplayFields();
					for (const item of fields) {
						if (item.key in fieldValues) {
							fieldValues[item.key] = item.value;
						}
					}
				} else if (newData && typeof newData === 'object') {
					for (const [key, value] of Object.entries(newData)) {
						if (key in fieldValues) {
							fieldValues[key] = value;
						}
					}
				}
			},
			{ deep: true }
		);

		return {
			frameNavigator,
			validationErrors,
			fieldValues,
			displayFields,
			validateAll,
		};
	},

	methods: {
		getObjectSummary(value: Record<string, any>): string {
			if (!value) return "{}";
			const keys = Object.keys(value);
			if (keys.length === 0) return "{}";
			const preview = keys.slice(0, 3).join(", ");
			return keys.length > 3
				? `{ ${preview}... (${keys.length} полей) }`
				: `{ ${preview} }`;
		},
		
		getArraySummary(value: any[]): string {
			if (!Array.isArray(value)) return "[]";
			if (value.length === 0) return "[]";
			const first = value[0];
			if (typeof first === 'object' && !Array.isArray(first)) {
				return `[ ${value.length} объектов ]`;
			}
			const preview = value.slice(0, 3).join(", ");
			return value.length > 3
				? `[ ${preview}... (${value.length} элементов) ]`
				: `[ ${preview} ]`;
		},
		
		handleNavigate(key: string) {
			this.frameNavigator?.navigate?.(key);
		},
	},
};
</script>

<style scoped>
.form-frame {
	background: #2a2a2a;
	border-radius: 8px;
	padding: 24px;
	border: 1px solid #3d3d3d;
	color: #e0e0e0;
}

.form-frame__title {
	margin-bottom: 20px;
	padding-bottom: 12px;
	border-bottom: 1px solid #3d3d3d;
}

.form-frame__title h3 {
	margin: 0;
	font-size: 18px;
	color: #e8e8e8;
	font-weight: 600;
}

.form-field {
	margin-bottom: 16px;
}

.form-field.field-hidden {
	opacity: 0.4;
}

.form-field__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 6px;
}

.form-field label {
	font-weight: 500;
	font-size: 14px;
	color: #b0b0b0;
}

.navigate-btn {
	background: transparent;
	border: 1px solid #4a4a4a;
	color: #42b883;
	width: 28px;
	height: 28px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.navigate-btn:hover {
	background: #42b883;
	color: #1e1e1e;
	border-color: #42b883;
}

.form-field input,
.form-field textarea,
.form-field select {
	width: 100%;
	padding: 8px 12px;
	background: #333333;
	border: 1px solid #4a4a4a;
	border-radius: 6px;
	font-size: 14px;
	color: #e0e0e0;
	transition: border-color 0.2s, box-shadow 0.2s;
	box-sizing: border-box;
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
	outline: none;
	border-color: #42b883;
	box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.form-field input::placeholder,
.form-field textarea::placeholder {
	color: #777;
}

.form-field input[type="checkbox"] {
	width: 18px;
	height: 18px;
	margin-top: 4px;
	accent-color: #42b883;
	cursor: pointer;
}

.object-summary {
	padding: 8px 12px;
	background: #333333;
	border: 1px solid #4a4a4a;
	border-radius: 6px;
	font-size: 13px;
	color: #999;
	font-family: "Consolas", "Monaco", monospace;
	cursor: default;
	user-select: none;
}

.field-description {
	font-size: 12px;
	color: #888;
	margin-top: 4px;
	line-height: 1.3;
}

.field-error {
	color: #ff6b6b;
	font-size: 12px;
	margin-top: 4px;
}

.form-frame__actions {
	margin-top: 20px;
	padding-top: 16px;
	border-top: 1px solid #3d3d3d;
	display: flex;
	gap: 10px;
	justify-content: flex-end;
}
</style>