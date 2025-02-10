<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { loadGoogleMaps } from '@/lib/google-maps'; 
import { useTranslations } from '@/composables/useTranslations';

const locationInput = ref<HTMLInputElement | null>(null);
const description = ref('');
const selectedLocation = ref<{
  address: string;
  latitude: number;
  longitude: number;
} | null>(null);
const { t } = useTranslations();

let autocomplete: google.maps.places.Autocomplete | null = null;

const emit = defineEmits(['submit']);

const handlePlaceSelection = async (placeId: string) => {
  try {
    const placesService = new google.maps.places.PlacesService(document.createElement('div'));
    const place = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
      placesService.getDetails(
        { 
          placeId,
          fields: ['geometry', 'formatted_address', 'name']
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error('Failed to get place details'));
          }
        }
      );
    });
    if (place.geometry?.location) {
      selectedLocation.value = {
        address: place.formatted_address || place.name || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      };
      console.log('Location selected:', selectedLocation.value);
    }
  } catch (error) {
    console.error('Error getting place details:', error);
  }
};

onMounted(async () => {
  try {
    await loadGoogleMaps();
    if (locationInput.value) {
      locationInput.value.setAttribute('inputmode', 'text');
      locationInput.value.setAttribute('enterkeyhint', 'search');
      
      autocomplete = new google.maps.places.Autocomplete(locationInput.value, {
        componentRestrictions: { country: 'us' },
        fields: ['geometry', 'formatted_address', 'name', 'place_id'],
        types: ['establishment', 'geocode']
      });
      const handleSelection = async (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const target = event.target as HTMLElement;
        const pacItem = target.closest('.pac-item');
        
        if (pacItem) {
          const mainText = pacItem.querySelector('.pac-item-query')?.textContent || '';
          const secondaryText = pacItem.querySelector('.pac-secondary-text')?.textContent || '';
          const fullText = `${mainText} ${secondaryText}`.trim();
          
          if (locationInput.value) {
            locationInput.value.value = fullText;
            locationInput.value.blur();

            const service = new google.maps.places.AutocompleteService();
            service.getPlacePredictions(
              { input: fullText },
              async (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions?.[0]) {
                  await handlePlaceSelection(predictions[0].place_id);
                }
              }
            );
          }
        }
      };
      const observer = new MutationObserver(() => {
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          ['touchstart', 'mousedown', 'click'].forEach(eventType => {
            pacContainer.removeEventListener(eventType, handleSelection);
            pacContainer.addEventListener(eventType, handleSelection, { passive: false });
          });
          pacContainer.style.pointerEvents = 'auto';
          pacContainer.style.touchAction = 'auto';
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete?.getPlace();
        if (place?.place_id) {
          await handlePlaceSelection(place.place_id);
        }
      });
    }
  } catch (error) {
    console.error('Error initializing Places Autocomplete:', error);
  }
});
const handleSubmit = async (event: Event) => {
  event.preventDefault();
  console.log('Form submission started');
  
  if (!selectedLocation.value) {
    console.log('No location selected');
    alert(t('pleaseSelectLocation'));
    return;
  }

  try {
    console.log('Creating sighting data');
    const sightingData = {
      location: selectedLocation.value.address,
      latitude: selectedLocation.value.latitude,
      longitude: selectedLocation.value.longitude,
      description: description.value,
      timestamp: new Date().toISOString(),
      confirmationCount: 0,
      inactiveCount: 0,
      lastConfirmedAt: new Date().toISOString()
    };

    const sightingsRef = collection(db, 'sightings');
    const docRef = await addDoc(sightingsRef, sightingData);

    if (locationInput.value) {
      locationInput.value.value = '';
    }
    description.value = '';
    selectedLocation.value = null;

    alert(t('sightingSubmitted'));

    emit('submit');
  } catch (error) {
    console.error('Error submitting sighting:', error);
    alert(t('errorSubmittingSighting'));
  }
};

</script>

<template>
  <div class="w-full">
    <form @submit="handleSubmit" class="space-y-4">
      <div>
        <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
          {{ t('location') }}
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
          :placeholder="t('enterLocation')"
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
          {{ t('description') }} {{ t('optional') }}
        </label>
        <textarea
          id="description"
          v-model="description"
          rows="3"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          :placeholder="t('addAdditionalDetails')"
        ></textarea>
      </div>
      <Button
        type="submit"
        class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
        :disabled="!selectedLocation"
        >
        {{ t('submitReport') }}
      </Button>
    </form>
  </div>
</template>

<style>
.pac-container {
  touch-action: manipulation !important;
  z-index: 9999 !important;
}

.pac-item {
  min-height: 44px !important; 
  padding: 12px 8px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
}

.pac-item:hover {
  background-color: rgba(0,0,0,0.05) !important;
}

.pac-item-selected {
  background-color: rgba(0,0,0,0.05) !important;
}

@media (max-width: 768px) {
  .pac-container {
    width: calc(100% - 32px) !important;
    left: 16px !important;
    right: 16px !important;
  }
  
  .pac-item {
    padding: 16px 12px !important;
  }
}
</style>