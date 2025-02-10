<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Map from './components/Map.vue';
import SightingForm from './components/SightingForm.vue';
import RadiusSearch from './components/RadiusSearch.vue';
import SightingsList from './components/SightingsList.vue';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DialogPortal, DialogOverlay } from './components/ui/dialog';
import type { Sighting } from './types/sighting';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

const sightings = ref<Sighting[]>([]);
const selectedRadius = ref<{
  radius: number;
  latitude: number;
  longitude: number;
} | null>(null);

const dialog = ref(false); 

onMounted(() => {
  const q = query(collection(db, 'sightings'));
  onSnapshot(q, (snapshot) => {
    sightings.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Sighting));
  });
});
const handleSightingSubmit = () => {
  dialog.value = false; 
};
const handleRadiusChange = (radiusData: typeof selectedRadius.value) => {
  selectedRadius.value = radiusData;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
          Mapa de Las Redadas de ICE
        </h1>
        <Dialog v-model:open="dialog">
          <DialogTrigger asChild>
            <Button size="lg" class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-8">
              Report Sighting
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogOverlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <DialogContent class="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-8 shadow-2xl">
              <DialogTitle class="text-2xl font-bold text-gray-900 mb-2">Report ICE Sighting</DialogTitle>
              <DialogDescription class="text-gray-600 mb-6">
                Enter the location where you spotted ICE activity
              </DialogDescription>
              <SightingForm @submit="handleSightingSubmit" />
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>
      <div class="space-y-6">
        <RadiusSearch @radius-changed="handleRadiusChange" />
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <Map 
        :sightings="sightings" 
        :selectedRadius="selectedRadius"
      />
        </div>
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Recent Sightings</h2>
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
            <p class="text-sm text-yellow-800">
              <strong>Warning:</strong> This is a user-led initiative. All sightings are reported by community members and should be verified independently.
            </p>
          </div>
          <SightingsList />
        </div>
      </div>
    </div>
    <footer class="mt-8 pb-4 text-center">
    <p class="text-sm">
      Created by 
      <span class="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent font-medium">
        Eduardo Ramos
      </span>
      <span class="mx-2">|</span>
      <a 
        href="https://github.com/eduardorrramos" 
        target="_blank" 
        rel="noopener noreferrer"
        class="text-gray-600 hover:text-red-600"
      >
        GitHub
      </a>
      <span class="mx-2">|</span>
      <a 
        href="https://linkedin.com/in/eduardorrramos" 
        target="_blank" 
        rel="noopener noreferrer"
        class="text-gray-600 hover:text-red-600"
      >
        LinkedIn
      </a>
    </p>
  </footer>
  </div>
</template>