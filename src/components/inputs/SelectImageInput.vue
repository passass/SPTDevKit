<!-- src/components/inputs/SelectImageInput.vue -->
<template>
    <div class="select-image-input">
        <div class="select-image-input__controls">
            <button type="button" class="select-image-input__btn" @click="handleFileChange">
                {{ uitext('selectImage') }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { uitext } from "@/types/localization";

const emit = defineEmits<{
    (e: "imageSelected", payload: Record<string, any>): void;
}>();

async function handleFileChange(event: Event) {
	const payload = await window.electronAPI.selectFile({
	    title: uitext('selectImage'),
	    buttonLabel: uitext('select'),
	    filters: [
	        { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
	    ],
	});

    emit("imageSelected", payload);
}


</script>

<style scoped>
.select-image-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 15px;
    margin-bottom: 15px;
}

.select-image-input__preview {
    position: relative;
    width: 100%;
    min-height: 120px;
    max-height: 240px;
    background: #222222;
    border: 1px dashed #4a4a4a;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.2s, background 0.2s;
}

.select-image-input__preview:hover {
    border-color: #42b883;
    background: #2a2a2a;
}

.select-image-input__img {
    max-width: 100%;
    max-height: 240px;
    object-fit: contain;
    display: block;
}

.select-image-input__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: #666;
    font-size: 12px;
    user-select: none;
}

.select-image-input__icon {
    font-size: 32px;
    opacity: 0.7;
}

.select-image-input__controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
}

.select-image-input__btn {
    padding: 6px 14px;
    background: #42b883;
    border: none;
    border-radius: 4px;
    color: #1a1a1a;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.select-image-input__btn:hover {
    background: #66d9a0;
}

.select-image-input__btn:active {
    transform: translateY(1px);
}

.select-image-input__btn--danger {
    background: #e74c3c;
    color: #fff;
}

.select-image-input__btn--danger:hover {
    background: #c0392b;
}

.select-image-input__file {
    display: none;
}
</style>
