<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStudio } from '../composables/useStudio'

const router = useRouter()
const route = useRoute()
const { git } = useStudio()

const isWaitingForDeployment = ref(true)
const deploymentCheckStarted = ref(false)

const changeCount = computed(() => {
  const queryCount = route.query.changeCount
  return queryCount ? Number.parseInt(queryCount as string, 10) : 0
})
const branchUrl = computed(() => git.getBranchUrl())
const repositoryInfo = computed(() => git.getRepositoryInfo())

const alertDescription = computed(() => {
  if (isWaitingForDeployment.value) {
    return 'The website needs to be deployed for changes to be visible in Studio.'
  }
  return 'A new version of your website has been deployed. Please refresh your app to see changes in Studio.'
})

function goBack() {
  router.push('/content')
}

onMounted(() => {
  deploymentCheckStarted.value = true

  // TODO: implemented manifest detection logic
  setTimeout(() => {
    isWaitingForDeployment.value = false
  }, 10000)
})
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-default">
    <div class="flex flex-col gap-8 max-w-md">
      <div class="flex justify-center">
        <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <UIcon
            name="i-lucide-check-circle-2"
            class="w-8 h-8 text-success"
          />
        </div>
      </div>

      <div class="text-center">
        <h1 class="text-2xl font-bold text-default mb-2">
          Changes Published
        </h1>
        <p class="text-dimmed">
          <span class="font-semibold text-default">{{ changeCount }}</span>
          {{ changeCount === 1 ? 'change' : 'changes' }} published on
          <span class="font-semibold text-default">{{ repositoryInfo.branch }}</span>
          of
          <span class="font-semibold text-default">{{ repositoryInfo.owner }}/{{ repositoryInfo.repo }}</span>
        </p>
      </div>

      <!-- Deployment Info -->
      <UAlert
        :icon="isWaitingForDeployment ? 'i-lucide-loader' : 'i-lucide-check'"
        :title="isWaitingForDeployment ? 'Waiting for deployment...' : 'Deployment complete'"
        :description="alertDescription"
        :color="isWaitingForDeployment ? 'warning' : 'success'"
        variant="soft"
        :ui="{ icon: isWaitingForDeployment ? 'animate-spin' : '' }"
      />

      <div class="flex gap-2 justify-center">
        <UButton
          :to="branchUrl"
          target="_blank"
          icon="i-simple-icons:github"
          variant="soft"
        >
          Check on GitHub
        </UButton>
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          @click="goBack"
        >
          Back to Content
        </UButton>
      </div>
    </div>
  </div>
</template>
