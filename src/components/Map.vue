<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { loadGoogleMaps } from '@/lib/google-maps';
import type { Sighting } from '@/types/sighting';

const props = withDefaults(defineProps<{
  sightings: Sighting[];
  selectedRadius?: {
    radius: number;
    latitude: number;
    longitude: number;
  } | null;
}>(), {
  sightings: () => [],
  selectedRadius: null
});

const mapContainer = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const markers = ref<google.maps.Marker[]>([]);
const circle = ref<google.maps.Circle | null>(null);

const initMap = async () => {
  try {
    await loadGoogleMaps();
    
    if (!mapContainer.value) return;

    const defaultCenter = { lat: 39.8283, lng: -98.5795 }; 
    map.value = new google.maps.Map(mapContainer.value, {
      zoom: 4,
      center: defaultCenter,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      gestureHandling: 'cooperative'
    });

    window.gm_authFailure = () => {
  console.error('Google Maps authentication failed. Please check your API key.');
};

  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

const updateMarkers = () => {
  if (!props.sightings || !Array.isArray(props.sightings)) {
    console.warn('No sightings available or invalid sightings data');
    return;
  }
  markers.value.forEach(marker => marker.setMap(null));
  markers.value = [];

  props.sightings.forEach(sighting => {
    if (!map.value || !sighting.latitude || !sighting.longitude) return;
    const marker = new google.maps.Marker({
      position: { 
        lat: sighting.latitude, 
        lng: sighting.longitude 
      },
      map: map.value,
      title: sighting.location,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: sighting.isActive ? '#22c55e' : '#ef4444',
        fillOpacity: 0.8,
        strokeWeight: 2,
        strokeColor: 'white'
      }
    });

    marker.addListener('click', () => {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${sighting.location}</h3>
            <p class="text-sm text-gray-600">${sighting.description || 'No description'}</p>
            <p class="text-xs text-gray-500 mt-1">
              Reported: ${new Date(sighting.timestamp).toLocaleString()}
            </p>
          </div>
        `
      });
      infoWindow.open(map.value, marker);
    });
    markers.value.push(marker);
  });
};
    

const updateRadius = () => {
  if (!map.value || !props.selectedRadius) return;
  if (circle.value) {
    circle.value.setMap(null);
  }
  circle.value = new google.maps.Circle({
    map: map.value,
    center: { 
      lat: props.selectedRadius.latitude, 
      lng: props.selectedRadius.longitude 
    },
    radius: props.selectedRadius.radius * 1609.34,
    fillColor: '#ef4444',
    fillOpacity: 0.1,
    strokeColor: '#ef4444',
    strokeWeight: 2
  });
  map.value.fitBounds(circle.value.getBounds()!);
};

watch(() => props.sightings, updateMarkers, { deep: true });

watch(() => props.selectedRadius, updateRadius, { deep: true });

onMounted(async () => {
  await initMap();
  updateMarkers();
  if (props.selectedRadius) {
    updateRadius();
  }
});
</script>

<template>
  <div ref="mapContainer" class="w-full h-[600px] rounded-lg overflow-hidden shadow-lg"></div>
</template>