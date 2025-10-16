<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed, reactive } from 'vue'
import * as z from 'zod'
import { useStudio } from '../composables/useStudio'
import { StudioBranchActionId } from '../types'
import { useToast } from '@nuxt/ui/composables/useToast'

const router = useRouter()
const route = useRoute()
const { context } = useStudio()

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore defineShortcuts is auto-imported
defineShortcuts({
  escape: () => {
    state.commitMessage = ''
    router.push('/content')
  },
})

const schema = z.object({
  commitMessage: z.string().nonempty('Commit message is required'),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  commitMessage: '',
})

let isPublishing = false

const items = [
  {
    label: 'Content',
    value: 'content',
    to: '/content',
  },
  {
    label: 'Media',
    value: 'media',
    to: '/media',
  },
]

const current = computed({
  get: () => route.name as string,
  set: (name: string) => router.push({ name }),
})

const toast = useToast()
const isReviewPage = computed(() => route.name === 'review')

async function publishChanges() {
  if (isPublishing) return

  isPublishing = true
  try {
    await context.branchActionHandler[StudioBranchActionId.PublishBranch]({ commitMessage: state.commitMessage })

    toast.add({
      title: 'Changes published',
      description: 'Changes have been successfully pushed to the remote repository.',
      color: 'success',
    })

    state.commitMessage = ''
  }
  catch (error) {
    toast.add({
      title: 'Failed to publish changes',
      description: (error as Error).message,
      color: 'error',
    })
  }
  finally {
    isPublishing = false
  }
}
</script>

<template>
  <div class="bg-muted/50 border-default border-b-[0.5px] pr-4 gap-1.5 flex items-center justify-between px-4">
    <div
      v-if="!isReviewPage"
      class="w-full flex items-center justify-between gap-2"
    >
      <UTabs
        v-model="current"
        :content="false"
        :items="items"
        variant="link"
        size="md"
        color="neutral"
        :ui="{ trigger: 'py-1 px-2', list: 'p-2' }"
      />

      <UButton
        label="Review"
        color="neutral"
        variant="solid"
        :disabled="context.draftCount.value === 0"
        to="/review"
        class="w-20"
      >
        <div class="flex items-center gap-2">
          <span class="w-10">
            Review
          </span>
          <UBadge
            v-if="context.draftCount.value > 0"
            :label="context.draftCount.value.toString()"
            class="bg-[var(--ui-color-neutral-400)]"
            size="xs"
            variant="soft"
          />
          <UIcon
            v-else
            name="i-lucide-eye"
            class="w-3 h-3"
          />
        </div>
      </UButton>
    </div>

    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="py-2 w-full"
      @submit="publishChanges"
    >
      <template #default="{ errors }">
        <div class="w-full flex items-center gap-2">
          <UTooltip
            text="Back to content"
            :kbds="['esc']"
          >
            <UButton
              icon="i-ph-arrow-left"
              color="neutral"
              variant="soft"
              size="sm"
              aria-label="Back"
              to="/content"
            />
          </UTooltip>

          <UFormField
            name="commitMessage"
            class="w-full"
            :ui="{ error: 'hidden' }"
          >
            <template #error>
              <span />
            </template>

            <UInput
              v-model="state.commitMessage"
              placeholder="Commit message"
              size="sm"
              :disabled="isPublishing"
              class="w-full"
              :ui="{ base: 'focus-visible:ring-1' }"
            />
          </UFormField>

          <UTooltip :text="(errors?.length > 0 && errors[0]?.message) || 'Publish changes'">
            <UButton
              type="submit"
              color="neutral"
              variant="solid"
              :loading="isPublishing"
              :disabled="errors.length > 0 || isPublishing"
            >
              <div class="flex items-center gap-2">
                <span class="w-10">
                  Publish
                </span>

                <UIcon
                  name="i-lucide-save"
                  class="w-3 h-3"
                />
              </div>
            </UButton>
          </UTooltip>
        </div>
      </template>
    </UForm>
  </div>
</template>
