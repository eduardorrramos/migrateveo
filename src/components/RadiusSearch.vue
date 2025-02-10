<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import type { RadiusOptions } from '@/types/sighting';
import { loadGoogleMaps } from '@/lib/google-maps';

const searchInput = ref<HTMLInputElement | null>(null);
const selectedRadius = ref<RadiusOptions['radius']>(10);
const radiusOptions: RadiusOptions['radius'][] = [5, 10, 25, 50];

const emit = defineEmits(['radiusChanged']);

const searchByRadius = async () => {
  if (!searchInput.value?.value) return;
  try {
    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ 
      address: searchInput.value.value + ', USA'
    });
    
    if (result.results[0]?.geometry?.location) {
      const location = result.results[0].geometry.location;
      emit('radiusChanged', {
        radius: selectedRadius.value,
        latitude: location.lat(),
        longitude: location.lng()
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
};

onMounted(async () => {
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-lg p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Search Nearby Sightings</h2>
    <div class="flex flex-col md:flex-row gap-8 items-start md:items-end">
      <div class="w-full md:w-auto">
        <label for="location" class="block text-sm font-medium text-gray-700 mb-2">Location</label>
        <input
          ref="searchInput"
          type="text"
          id="location"
          class="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
          placeholder="Enter a location"
          autocomplete="off"
        />
      </div>
      <div class="w-full md:w-auto flex-grow">
        <label class="block text-sm font-medium text-gray-700 mb-2">Search Radius</label>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="radius in radiusOptions"
            :key="radius"
            :variant="selectedRadius === radius ? 'default' : 'outline'"
            size="lg"
            @click="selectedRadius = radius"
            :class="`
              'min-w-[70px] transition-all duration-200 ${
              selectedRadius === radius 
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md' 
                : 'hover:border-red-500 hover:text-red-600'
        }`"
          >
            {{ radius }}mi
          </Button>
        </div>
      </div>
      <Button
        size="lg"
        class="w-full md:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8"
        :disabled="!searchInput?.value"
        @click="searchByRadius"
      >
        Search Area
      </Button>
    </div>
  </div>
</template>