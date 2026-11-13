<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudio } from '../composables/useStudio'
import { useI18n } from 'vue-i18n'
import { GITLAB_TOKEN_EXPIRED_ERROR_CODE } from '../utils/providers/gitlab-errors'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { gitProvider, host } = useStudio()

const isGitLabTokenExpired = computed(() => route.query.code === GITLAB_TOKEN_EXPIRED_ERROR_CODE)

const errorMessage = computed(() => {
  if (isGitLabTokenExpired.value) {
    return t('studio.publish.gitlabTokenExpiredDescription')
  }

  return (route.query.error as string) || t('studio.notifications.error.unknown')
})

const alertTitle = computed(() => {
  if (isGitLabTokenExpired.value) {
    return t('studio.publish.gitlabTokenExpiredTitle')
  }

  return t('studio.publish.errorTitle', { providerName: gitProvider.name })
})

const repositoryInfo = computed(() => gitProvider.api.getRepositoryInfo())

async function retry() {
  await router.push('/review')
}

function signOut() {
  fetch('/__nuxt_studio/auth/session', { method: 'delete' }).then(() => {
    host.app.unregisterServiceWorker()
    window.location.reload()
  })
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
          {{ $t('studio.publish.failedTitle') }}
        </h1>
        <i18n-t
          keypath="studio.publish.summary"
          tag="p"
          class="text-dimmed flex items-center flex-wrap justify-center gap-x-1"
        >
          <template #branch>
            <UButton
              :label="repositoryInfo.branch"
              icon="i-lucide-git-branch"
              :to="gitProvider.api.getBranchUrl()"
              variant="link"
              target="_blank"
              :padded="false"
            />
          </template>
          <template #repo>
            <UButton
              :label="`${repositoryInfo.owner}/${repositoryInfo.repo}`"
              :icon="gitProvider.icon"
              :to="gitProvider.api.getRepositoryUrl()"
              variant="link"
              target="_blank"
              :padded="false"
            />
          </template>
        </i18n-t>
      </div>

      <UAlert
        icon="i-lucide-alert-triangle"
        :title="alertTitle"
        :description="errorMessage"
        color="error"
        variant="soft"
      />

      <div class="flex justify-center gap-2 h-7">
        <UButton
          v-if="isGitLabTokenExpired"
          icon="i-lucide-log-out"
          color="primary"
          @click="signOut"
        >
          {{ $t('studio.buttons.signOut') }}
        </UButton>
        <UButton
          v-else
          icon="i-lucide-rotate-ccw"
          @click="retry"
        >
          {{ $t('studio.buttons.retryPublish') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
