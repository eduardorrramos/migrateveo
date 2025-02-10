<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { loadGoogleMaps } from '@/lib/google-maps'; 


const locationInput = ref<HTMLInputElement | null>(null);
const description = ref('');
const selectedLocation = ref<{
  address: string;
  latitude: number;
  longitude: number;
} | null>(null);

let autocomplete: google.maps.places.Autocomplete | null = null;

const emit = defineEmits(['submit']);

onMounted(async () => {
  try {
    await loadGoogleMaps();
    if (locationInput.value) {
      locationInput.value.setAttribute('inputmode', 'text');
      locationInput.value.setAttribute('enterkeyhint', 'search');
      
      autocomplete = new google.maps.places.Autocomplete(locationInput.value, {
        componentRestrictions: { country: 'us' },
        fields: ['geometry', 'formatted_address', 'name', 'address_components'],
        types: ['establishment', 'geocode']
      });

      locationInput.value.removeEventListener('keydown', () => {});

      const handleTouchStart = (e: Event) => {
  e.preventDefault();
  const target = e.target as HTMLElement;
  if (target.classList.contains('pac-item')) {
    target.click();
  }
};
      const observer = new MutationObserver((_, obs) => {
  const pacContainer = document.querySelector('.pac-container');
  if (pacContainer) {
    pacContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    obs.disconnect();
  }
});

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete?.getPlace();
        console.log('Selected place:', place);

        if (!place?.geometry?.location) {
          console.error('No location found for this place');
          return;
        }

        selectedLocation.value = {
          address: place.formatted_address || place.name || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        };
      });
    }
  } catch (error) {
    console.error('Error initializing Places Autocomplete:', error);
  }
});

const handleSubmit = async () => {
  if (!selectedLocation.value) {
    alert('Please select a location from the dropdown');
    return;
  }

  try {
    const sightingData = {
      location: selectedLocation.value.address,
      latitude: selectedLocation.value.latitude,
      longitude: selectedLocation.value.longitude,
      description: description.value,
      timestamp: new Date().toISOString()
    };

    console.log('Submitting sighting:', sightingData); 

    await addDoc(collection(db, 'sightings'), sightingData);
    emit('submit');
    
    if (locationInput.value) locationInput.value.value = '';
    description.value = '';
    selectedLocation.value = null;
  } catch (error) {
    console.error('Error submitting sighting:', error);
    alert('Error submitting sighting. Please try again.');
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
        Location
      </label>
      <input
        ref="locationInput"
        type="text"
        id="location"
        required
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        class="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
        placeholder="Enter location"
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
        Description (Optional)
      </label>
      <textarea
        id="description"
        v-model="description"
        rows="3"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
        placeholder="Add any additional details"
      ></textarea>
    </div>

    <Button
      type="submit"
      class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
    >
      Submit Report
    </Button>
  </form>
</template>
<style>
.pac-container {
  touch-action: manipulation;
}

.pac-item {
  min-height: 44px !important; 
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
</style>