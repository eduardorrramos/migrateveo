<script setup lang="ts">
  import { ref, onMounted, provide } from 'vue';
  import Map from './components/Map.vue';
  import SightingForm from './components/SightingForm.vue';
  import RadiusSearch from './components/RadiusSearch.vue';
  import SightingsList from './components/SightingsList.vue';
  import { Button } from './components/ui/button';
  import type { Sighting } from './types/sighting';
  import { collection, query, onSnapshot } from 'firebase/firestore';
  import { db } from './lib/firebase';
  import { translations } from './lib/translations';

  const currentLanguage = ref<'en' | 'es'>('es');
  const t = (key: keyof typeof translations.en) => {
    return translations[currentLanguage.value][key];
  };
  provide('t', t);
  const toggleLanguage = () => {
    currentLanguage.value = currentLanguage.value === 'en' ? 'es' : 'en';
  };
  const sightings = ref<Sighting[]>([]);
  const selectedRadius = ref<{
    radius: number;
    latitude: number;
    longitude: number;
  } | null>(null);

  onMounted(() => {
    const q = query(collection(db, 'sightings'));
    onSnapshot(q, (snapshot) => {
      sightings.value = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Sighting
      );
    });
  });
  const handleSightingSubmit = () => {
    closeModal();
  };

  const handleRadiusChange = (radiusData: typeof selectedRadius.value) => {
    selectedRadius.value = radiusData;
  };

  const isModalOpen = ref(false);
  const openModal = () => {
    isModalOpen.value = true;
  };
  const closeModal = () => {
    isModalOpen.value = false;
  };
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div
        class="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between items-center mb-8"
      >
        <h1
          class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent text-center sm:text-left"
        >
          {{ t('title') }}
        </h1>
        <div
          class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end"
        >
          <Button
            @click="toggleLanguage"
            variant="outline"
            size="sm"
            class="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-200"
          >
            {{ currentLanguage === 'en' ? 'Español' : 'English' }}
          </Button>

          <Button
            @click="openModal"
            size="lg"
            class="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 sm:px-8 py-2 rounded-md shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {{ t('reportButton') }}
          </Button>
          <Teleport to="body">
            <Transition name="fade">
              <div
                v-if="isModalOpen"
                class="fixed inset-0 z-50 flex items-center justify-center"
              >
                <div
                  class="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  @click="closeModal"
                ></div>
                <div
                  class="relative bg-white w-[calc(100%-2rem)] sm:w-full max-w-md rounded-xl p-6 sm:p-8 shadow-2xl"
                  @click.stop
                >
                  <button
                    @click="closeModal"
                    class="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                  >
                    <XIcon class="h-4 w-4" />
                    <span class="sr-only">Close</span>
                  </button>

                  <h2 class="text-2xl font-bold text-gray-900 mb-2">
                    {{ t('reportTitle') }}
                  </h2>
                  <p class="text-gray-600 mb-6">
                    {{ t('reportDescription') }}
                  </p>
                  <SightingForm @submit="handleSightingSubmit" />
                </div>
              </div>
            </Transition>
          </Teleport>
        </div>
      </div>
      <div class="space-y-6">
        <RadiusSearch @radius-changed="handleRadiusChange" />
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <Map :sightings="sightings" :selectedRadius="selectedRadius" />
        </div>
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            {{ t('recentSightings') }}
          </h2>
          <div
            class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg"
          >
            <p class="text-sm text-yellow-800">
              <strong>{{ t('warning') }}:</strong> {{ t('warningText') }}
            </p>
          </div>
          <SightingsList />
        </div>
      </div>
    </div>
    <footer class="mt-8 pb-8 px-6 text-center w-full max-w-7xl mx-auto">
      <p class="text-sm flex items-center justify-center space-x-2">
        <span>{{ t('createdBy') }}</span>
        <span
          class="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent font-medium"
        >
          Eduardo Ramos
        </span>
        <span class="flex items-center space-x-4">
          <span>|</span>
          <a
            href="https://github.com/eduardorrramos"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-600 hover:text-red-600 inline-flex items-center"
          >
            <img src="/github-mark.svg" alt="GitHub" class="w-4 h-4" />
          </a>
          <span>|</span>
          <a
            href="https://linkedin.com/in/eduardorrramos"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-600 hover:text-red-600 inline-flex items-center"
          >
            <img src="/linkedin-mark.svg" alt="LinkedIn" class="w-4 h-4" />
          </a>
        </span>
      </p>
    </footer>
  </div>
</template>
