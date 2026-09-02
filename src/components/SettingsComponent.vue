<!-- src/components/SettingsComponent.vue -->
<template>
  <div class="settings-container">
    <FolderSelector
      v-model="selectedPath"
      :loading="isLoading"
      label="Выбрать папку проекта"
      icon="📁"
      variant="project"
      @select="selectFolder"
    />

    <button class="save-project-btn" @click="Project.saveProject()">
      💾 Сохранить проект
    </button>

    <FolderSelector
      v-model="eftPath"
      :loading="isLoadingEft"
      label="Выбрать папку EFT"
      icon="🎮"
      path-icon="🎮"
      variant="eft"
      @select="selectEftFolder"
    />

    <div class="profile-select-wrapper">
      <label class="profile-label">👤 Профиль</label>
      <select v-model="profilesStore.selectedProfile" class="profile-select">
        <option v-for="username in Object.keys(profilesStore.profiles)" :key="username" :value="username">
          {{ username }}
        </option>
      </select>
    </div>

    <button class="" @click="console.log(dataStore.getAllDirties('quests'))">тест</button>
  </div>
</template>

<script setup lang="ts">
import { isElectron } from '@/utils/utils';

if (!isElectron()) throw new Error('это компонент работает только в electron');

import { ref, onMounted } from 'vue';
import Project from '@/project/Project';
import FolderSelector from '@/components/selectors/FolderSelector.vue';
import { Path } from '@/utils/pathUtils';
import { useProfilesStore } from '@/stores/profileStore';
import { useDataStore } from '@/stores/dataStore';

const profilesStore = useProfilesStore();
const dataStore = useDataStore();

const selectedPath = ref<string>(Project.currentProjectFolder?.filePath ?? '');
const isLoading = ref(false);
const eftPath = ref<string>('');
const isLoadingEft = ref(false);

async function selectFolder() {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    const folderPath = await window.electronAPI.selectFolder();

    if (!folderPath) {
      return;
    }

    Project.loadProject(new Path(folderPath));
    selectedPath.value = folderPath;
  } catch (error) {
    alert('Ошибка при выборе папки');
  } finally {
    isLoading.value = false;
  }
}

async function selectEftFolder() {
  if (isLoadingEft.value) return;

  isLoadingEft.value = true;
  try {
    const folderPath = await window.electronAPI.selectFolder();

    if (!folderPath) {
      console.log('Выбор папки EFT отменён');
      return;
    }

    eftPath.value = folderPath;
    localStorage.setItem('eftFolderPath', folderPath);
    console.log('Папка EFT сохранена:', folderPath);
    await Project.loadEFTMods(new Path(folderPath));
  } catch (error) {
    console.error('Ошибка при выборе папки EFT:', error);
    alert('Ошибка при выборе папки EFT');
  } finally {
    isLoadingEft.value = false;
  }
}

onMounted(() => {
  const savedEftPath = localStorage.getItem('eftFolderPath');
  if (savedEftPath) {
    eftPath.value = savedEftPath;
  }
});
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.save-project-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 16px 0;
  padding: 10px 24px;
  background: #42b883;
  border: none;
  border-radius: 6px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.25);
}

.save-project-btn:hover {
  background: #66d9a0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.35);
}

.save-project-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.25);
}

.profile-select-wrapper {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.profile-label {
  font-weight: 500;
  font-size: 14px;
  color: #b0b0b0;
}

.profile-select {
  padding: 6px 12px;
  background: #333333;
  border: 1px solid #4a4a4a;
  border-radius: 6px;
  font-size: 14px;
  color: #e0e0e0;
  min-width: 160px;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.profile-select:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.15);
}

.profile-select option {
  background: #333333;
  color: #e0e0e0;
}
</style>
