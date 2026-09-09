<script lang="tsx">
import { defineComponent, computed } from "vue";
import { type Field, type RecordSchema } from "@/types/fields/fields";
import { fieldRender } from "@/types/fields/fieldsRender";
import { gameLocalization } from "@/types/localization";

export default defineComponent({
    props: {
        recordSchema: { type: Object as () => RecordSchema, required: true },
        field: { type: Object as () => Field, required: true },
    },
    setup(props) {
        const nestedSchema = computed(() => {
            if (!props.field.nestedSchema) return null;
            const rawData = props.recordSchema.data[props.field.key];
            if (!rawData || typeof rawData !== "object") return null;
            return new props.field.nestedSchema(rawData);
        });

        return () => {
            if (!nestedSchema.value) return null;

            const fields = nestedSchema.value
                .getFields()
                .filter((f) => f.type !== "object" && f.type !== "array" && !f.nestedSchema && !f.arrayItemSchema);

            const items = fields.map((f) => {
                const inputVnode = fieldRender({
                    recordSchema: nestedSchema.value!,
                    field: f,
                });
                const label = gameLocalization.getUIText({
                    localeId: f.key !== "" ? [f.key, f.label] : f.label,
                    default: f.label,
                });
                return (
                    <div class="compact-item">
                        <label class="compact-label">{label}</label>
                        {inputVnode}
                    </div>
                );
            });

            return <div class="compact-object-input">{items}</div>;
        };
    },
});
</script>

<style scoped>
.compact-object-input {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid #3d3d3d;
    border-radius: 6px;
}
.compact-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.compact-label {
    font-size: 12px;
    font-weight: 500;
    color: #b0b0b0;
}
.compact-item :deep(input),
.compact-item :deep(select),
.compact-item :deep(textarea) {
    padding: 6px 8px;
    font-size: 13px;
    background: #333333;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    color: #e0e0e0;
    width: 100%;
    box-sizing: border-box;
}
.compact-item :deep(input:focus),
.compact-item :deep(select:focus),
.compact-item :deep(textarea:focus) {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}
</style>
