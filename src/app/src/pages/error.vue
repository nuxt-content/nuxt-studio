<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudio } from '../composables/useStudio'

const route = useRoute()
const router = useRouter()
const { git } = useStudio()

const errorMessage = computed(() => {
  return (route.query.error as string) || 'An unknown error occurred'
})

const repositoryInfo = computed(() => git.getRepositoryInfo())

function retry() {
  router.push('/review')
}
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-default">
    <div class="flex flex-col gap-8 max-w-md">
      <div class="flex justify-center">
        <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <UIcon
            name="i-lucide-alert-circle"
            class="w-8 h-8 text-error"
          />
        </div>
      </div>

      <div class="text-center">
        <h1 class="text-2xl font-bold text-default mb-2">
          Publish Failed
        </h1>
        <p class="text-dimmed flex items-center flex-wrap justify-center">
          on
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
        icon="i-lucide-alert-triangle"
        title="GitHub API Error"
        :description="errorMessage"
        color="error"
        variant="soft"
      />

      <div class="flex justify-center h-7">
        <UButton
          icon="i-lucide-rotate-ccw"
          @click="retry"
        >
          Retry Publish
        </UButton>
      </div>
    </div>
  </div>
</template>
