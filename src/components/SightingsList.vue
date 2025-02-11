<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import { Button } from '@/components/ui/button';
  import { db } from '@/lib/firebase';
  import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
  } from 'firebase/firestore';
  import type { Sighting } from '@/types/sighting';
  import { useTranslations } from '@/composables/useTranslations';

  const sightings = ref<Sighting[]>([]);
  const forceUpdate = ref(0);
  const { t } = useTranslations();

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return t('never');
    return new Date(dateString).toLocaleString();
  };
  const hasVotedOnSighting = (sightingId: string): boolean => {
    const votedSightings = JSON.parse(
      localStorage.getItem('votedSightings') || '{}'
    );
    return votedSightings[sightingId] === true;
  };

  const markSightingAsVoted = (sightingId: string): void => {
    const votedSightings = JSON.parse(
      localStorage.getItem('votedSightings') || '{}'
    );
    votedSightings[sightingId] = true;
    localStorage.setItem('votedSightings', JSON.stringify(votedSightings));
  };
  const confirmSighting = async (sighting: Sighting) => {
    if (hasVotedOnSighting(sighting.id)) {
      alert('You have already voted on this sighting');
      return;
    }

    const confirmed = window.confirm(
      'Make sure this information is truthful. I confirm that this is accurate information'
    );
    if (!confirmed) return;

    try {
      const sightingRef = doc(db, 'sightings', sighting.id);
      await updateDoc(sightingRef, {
        isActive: true,
        lastConfirmedAt: Date.now(),
        confirmationCount: (sighting.confirmationCount || 0) + 1,
      });
      markSightingAsVoted(sighting.id);
    } catch (error) {
      console.error('Error confirming sighting:', error);
      alert('Error confirming sighting. Please try again.');
    }
  };
  const getTimeAgo = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const markInactive = async (sighting: Sighting) => {
    if (hasVotedOnSighting(sighting.id)) {
      alert('You have already voted on this sighting');
      return;
    }

    const confirmed = window.confirm(
      'Make sure this information is truthful. I confirm that this is accurate information'
    );
    if (!confirmed) return;

    try {
      const sightingRef = doc(db, 'sightings', sighting.id);
      const newInactiveCount = (sighting.inactiveCount || 0) + 1;
      await updateDoc(sightingRef, {
        inactiveCount: newInactiveCount,
        isActive: newInactiveCount >= 3 ? false : true,
      });
      markSightingAsVoted(sighting.id);
    } catch (error) {
      console.error('Error marking sighting inactive:', error);
      alert('Error updating sighting. Please try again.');
    }
  };
  const isCurrentlyActive = (lastConfirmedAt: string | undefined): boolean => {
    if (!lastConfirmedAt) return false;
    const lastConfirmed = new Date(lastConfirmedAt).getTime();
    const now = Date.now();
    return now - lastConfirmed < 24 * 60 * 60 * 1000;
  };

  const getStatusDisplay = (sighting: Sighting) => {
    if (!sighting.isActive)
      return { text: 'Inactive', classes: 'bg-red-100 text-red-800' };
    const active = isCurrentlyActive(sighting.lastConfirmedAt);
    return active
      ? { text: 'Active', classes: 'bg-green-100 text-green-800' }
      : { text: 'Expired', classes: 'bg-yellow-100 text-yellow-800' };
  };

  onMounted(() => {
    const q = query(collection(db, 'sightings'), orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
      sightings.value = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          location: data.location || '',
          timestamp: data.timestamp || Date.now(),
          isActive: data.isActive ?? true,
          lastConfirmedAt: data.lastConfirmedAt || null,
          confirmationCount: data.confirmationCount || 0,
          inactiveCount: data.inactiveCount || 0,
          description: data.description || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
        } as Sighting;
      });
    });
    const interval = setInterval(() => {
      forceUpdate.value++;
    }, 60000);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="sighting in sightings"
      :key="sighting.id"
      class="bg-gray-50 rounded-xl p-6 transition-all duration-200 hover:shadow-lg border border-gray-100"
    >
      <div
        class="flex flex-col md:flex-row md:justify-between md:items-start gap-6"
      >
        <div class="flex-grow">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            {{ sighting.location }}
          </h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {{ t('reported') }}: {{ formatDate(sighting.timestamp) }}
            </div>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :class="getStatusDisplay(sighting).classes"
              >
                {{ getStatusDisplay(sighting).text }}
              </span>
              <span class="text-sm text-gray-500">
                {{ t('lastConfirmed') }}:
                {{ formatDate(sighting.lastConfirmedAt) }}
                {{
                  sighting.lastConfirmedAt
                    ? `(${getTimeAgo(sighting.lastConfirmedAt)})`
                    : ''
                }}
              </span>
            </div>
            <p v-if="sighting.description" class="text-sm text-gray-600 mt-2">
              {{ sighting.description }}
            </p>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            size="lg"
            :class="`group border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white transition-all duration-200 ${
              hasVotedOnSighting(sighting.id) ? 'cursor-not-allowed ' : ''
            }`"
            @click="confirmSighting(sighting)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            {{ t('stillThere') }} ({{ sighting.confirmationCount }})
          </Button>
          <Button
            variant="outline"
            size="lg"
            :class="`group border-2 border-red-600 text-red-700 hover:bg-red-600 hover:text-white transition-all duration-200 ${
              hasVotedOnSighting(sighting.id) ? 'cursor-not-allowed ' : ''
            }`"
            @click="markInactive(sighting)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            {{ t('notThere') }} ({{ sighting.inactiveCount }})
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
