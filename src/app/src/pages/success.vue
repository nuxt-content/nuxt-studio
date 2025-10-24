<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStudio } from '../composables/useStudio'
import { useStudioState } from '../composables/useStudioState'

const route = useRoute()
const { git } = useStudio()
const { manifestId } = useStudioState()

const isReloadingApp = ref(false)
const isWaitingForDeployment = ref(true)
const previousManifestId = ref<string>(manifestId.value)

const changeCount = computed(() => {
  const queryCount = route.query.changeCount
  return queryCount ? Number.parseInt(queryCount as string, 10) : 0
})
const repositoryInfo = computed(() => git.getRepositoryInfo())

const alertDescription = computed(() => {
  if (isWaitingForDeployment.value) {
    return 'The website needs to be deployed for changes to be visible in Studio.'
  }
  return 'A new version of your website has been deployed. Please refresh your app to see changes in Studio.'
})

function reload() {
  isReloadingApp.value = true
  window.location.reload()
  setTimeout(() => {
    isReloadingApp.value = false
  }, 2000)
}

onMounted(() => {
  isWaitingForDeployment.value = true

  const newDeployment = watch(manifestId, (newId) => {
    console.log('newDeployment', newId)
    console.log('manifestId.value', manifestId.value)
    if (newId !== previousManifestId.value) {
      previousManifestId.value = newId
      isWaitingForDeployment.value = false
      newDeployment.stop()
    }
  })
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
        <p class="text-dimmed flex items-center flex-wrap justify-center">
          <span class="font-semibold text-default">{{ changeCount }} &nbsp;</span>
          {{ changeCount === 1 ? 'change' : 'changes' }} published on
          <UButton
            :label="repositoryInfo.branch"
            icon="i-lucide-git-branch"
            :to="git.getBranchUrl()"
            variant="link"
            target="_blank"
            :padded="false"
          />
          of
          <UButton
            :label="`${repositoryInfo.owner}/${repositoryInfo.repo}`"
            icon="i-simple-icons:github"
            :to="git.getRepositoryUrl()"
            variant="link"
            target="_blank"
            :padded="false"
          />
          repository
        </p>
      </div>

      <UAlert
        :icon="isWaitingForDeployment ? 'i-lucide-loader' : 'i-lucide-check'"
        :title="isWaitingForDeployment ? 'Waiting for deployment...' : 'Deployment complete'"
        :description="alertDescription"
        :color="isWaitingForDeployment ? 'warning' : 'success'"
        variant="soft"
        :ui="{ icon: isWaitingForDeployment ? 'animate-spin' : '' }"
      />

      <div class="flex justify-center h-7">
        <UButton
          v-if="!isWaitingForDeployment"
          icon="i-lucide-rotate-ccw"
          color="neutral"
          :loading="isReloadingApp"
          @click="reload"
        >
          Reload application
        </UButton>
      </div>
    </div>
  </div>
</template>
