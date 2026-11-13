<script setup lang="ts">
import { computed, ref } from 'vue'
import * as z from 'zod'
import { joinURL, withoutLeadingSlash } from 'ufo'
import { titleCase } from 'scule'
import { useI18n } from 'vue-i18n'
import { useStudio } from '../../../composables/useStudio'
import { StudioFeature, StudioItemActionId, TreeStatus, type TreeItem } from '../../../types'
import { filterDirectories, findDescendantsFileItemsFromFsPath, findDirectoryItem, findParentFromFsPath } from '../../../utils/tree'
import { getAvailableFileName, getFileExtension, parseName } from '../../../utils/file'
import { slugifyString } from '../../../utils/string'

const props = defineProps<{
  actionId: StudioItemActionId.MoveItem | StudioItemActionId.DuplicateItem
  item: TreeItem
}>()

const emit = defineEmits<{ close: [] }>()

const { context, host } = useStudio()
const { t } = useI18n()

const tree = context.activeTree.value
const isDuplicate = props.actionId === StudioItemActionId.DuplicateItem
const i18nPrefix = isDuplicate ? 'studio.destination.duplicate' : 'studio.destination.move'

const itemDisplayName = titleCase(props.item.name)
const itemFileName = parseName(props.item.fsPath.split('/').pop()!).name
const itemExtension = getFileExtension(props.item.fsPath)

const rootFsPath = tree.rootItem.value.fsPath
const currentFolderFsPath = findParentFromFsPath(tree.root.value, props.item.fsPath)?.fsPath ?? rootFsPath
const currentFolderSegments = currentFolderFsPath.split('/').filter(Boolean)
const expandedFolderFsPaths = [rootFsPath, ...currentFolderSegments.map((_, index) => currentFolderSegments.slice(0, index + 1).join('/'))]

const isOpen = ref(true)
const isSubmitting = ref(false)
const selectedFolderFsPath = ref(currentFolderFsPath)
const customName = ref<string>()

/**
 * Destination folder
 */
// A folder can't be moved into itself, so its subtree is left out
const folderTree = computed(() => filterDirectories(tree.rootItem.value, directory => directory.status !== TreeStatus.Deleted && directory.fsPath !== props.item.fsPath))

const selectedFolder = computed<TreeItem | undefined>({
  get: () => findDirectoryItem(folderTree.value, selectedFolderFsPath.value),
  set: (folder) => {
    if (folder) {
      selectedFolderFsPath.value = folder.fsPath
    }
  },
})

const isCurrentFolderSelected = computed(() => selectedFolderFsPath.value === currentFolderFsPath)
const selectedFolderLabel = computed(() => selectedFolder.value ? getFolderLabel(selectedFolder.value) : '')

/**
 * Destination name
 */
// Numeric prefixes don't change the route, so `2.guide.md` and `3.guide.md` count as the same name
const takenNames = computed(() => {
  const destinationFolder = findDirectoryItem(tree.rootItem.value, selectedFolderFsPath.value)

  return (destinationFolder?.children || [])
    .filter(child => !child.hide)
    .map(child => parseName(child.fsPath.split('/').pop()!).name)
})

// The copy keeps the original name when the destination allows it, `-copy` is added otherwise
const suggestedFileName = computed(() => getAvailableFileName(itemFileName, takenNames.value))

const name = computed({
  get: () => customName.value ?? suggestedFileName.value.slice(0, -(itemExtension.length + 1)),
  set: (value: string) => {
    customName.value = value
  },
})

const newFileName = computed(() => {
  if (!isDuplicate) {
    return itemFileName
  }

  if (customName.value === undefined) {
    return suggestedFileName.value
  }

  return `${slugifyString(customName.value).toLowerCase()}.${itemExtension}`
})

const newFsPath = computed(() => {
  const prefixedFileName = props.item.prefix ? `${props.item.prefix}.${newFileName.value}` : newFileName.value

  return withoutLeadingSlash(joinURL(selectedFolderFsPath.value, prefixedFileName))
})

const destinationPath = computed(() => `${tree.rootItem.value.name}/${newFsPath.value}`)

/**
 * Validation
 */
// The tree already shows the moved or copied item while the action finishes, so it isn't flagged as taken
const isNameTaken = computed(() => !isSubmitting.value && takenNames.value.includes(newFileName.value))

const nameSchema = computed(() => z.string()
  .refine(value => slugifyString(value).length > 0, t('studio.validation.nameEmpty'))
  .refine(value => !value.endsWith('.'), t('studio.validation.nameEndsWithDot')))

const nameError = computed(() => {
  if (!isDuplicate) {
    return undefined
  }

  const nameValidation = nameSchema.value.safeParse(name.value)
  if (!nameValidation.success) {
    return nameValidation.error.issues[0]?.message
  }

  if (isNameTaken.value) {
    return t('studio.destination.errors.fileExists', { folder: selectedFolderLabel.value })
  }

  return undefined
})

// Nuxt Content only stores documents matching a collection source
const isAcceptedByCollections = computed(() => {
  if (tree.type !== StudioFeature.Content) {
    return true
  }

  const movedFsPaths = props.item.type === 'file'
    ? [newFsPath.value]
    : findDescendantsFileItemsFromFsPath(tree.root.value, props.item.fsPath).map(descendant => descendant.fsPath.replace(props.item.fsPath, newFsPath.value))

  return movedFsPaths.every(fsPath => host.collection.getByFsPath(fsPath))
})

const destinationError = computed(() => {
  if (!isDuplicate && !isCurrentFolderSelected.value && isNameTaken.value) {
    const errorKey = props.item.type === 'directory' ? 'folderExists' : 'fileExists'

    return t(`studio.destination.errors.${errorKey}`, { folder: selectedFolderLabel.value })
  }

  if (!isAcceptedByCollections.value) {
    return t('studio.destination.errors.notAllowed', { folder: selectedFolderLabel.value })
  }

  return undefined
})

const canSubmit = computed(() => {
  if (isSubmitting.value || nameError.value || destinationError.value) {
    return false
  }

  return isDuplicate || !isCurrentFolderSelected.value
})

async function submitDestination() {
  if (!canSubmit.value) {
    return
  }

  const action = context.itemActions.value.find(action => action.id === props.actionId)!

  isSubmitting.value = true

  try {
    await action.handler!({ item: props.item, newFsPath: newFsPath.value })
  }
  finally {
    isSubmitting.value = false
  }
}

function getFolderLabel(folder: TreeItem) {
  return folder.type === 'root' ? t(`studio.nav.${folder.name.toLowerCase()}`, folder.name) : folder.name
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t(`${i18nPrefix}.title`, { name: itemDisplayName })"
    :description="t(`${i18nPrefix}.description`)"
    :ui="{ body: 'flex flex-col gap-4', footer: 'justify-between gap-3' }"
    @after:leave="emit('close')"
  >
    <template #body>
      <UFormField
        v-if="isDuplicate"
        :label="t('studio.destination.name')"
        :error="nameError"
      >
        <UInput
          v-model="name"
          :placeholder="t('studio.placeholders.fileName')"
          :disabled="isSubmitting"
          class="w-full"
          autofocus
          @keydown.enter.prevent="submitDestination"
        >
          <template #trailing>
            <span class="text-xs text-dimmed">.{{ itemExtension }}</span>
          </template>
        </UInput>
      </UFormField>

      <UFormField :label="t('studio.destination.folder')">
        <div class="max-h-72 overflow-y-auto rounded-md border border-default p-1">
          <UTree
            v-model="selectedFolder"
            :items="[folderTree]"
            :get-key="(folder: TreeItem) => folder.fsPath"
            :default-expanded="expandedFolderFsPaths"
            :disabled="isSubmitting"
            color="neutral"
            size="sm"
          >
            <!-- Folders without subfolders get a folder icon too -->
            <template #item-leading="{ item: folder, expanded, ui }">
              <UIcon
                :name="expanded && folder.children?.length ? 'i-lucide-folder-open' : 'i-lucide-folder'"
                :class="ui.linkLeadingIcon()"
              />
            </template>

            <template #item-label="{ item: folder }">
              <span class="flex min-w-0 items-center gap-1.5">
                <span class="truncate">{{ getFolderLabel(folder) }}</span>
                <UBadge
                  v-if="folder.fsPath === currentFolderFsPath"
                  :label="t('studio.destination.currentFolder')"
                  color="neutral"
                  variant="soft"
                  size="sm"
                />
              </span>
            </template>
          </UTree>
        </div>
      </UFormField>

      <UAlert
        v-if="destinationError"
        :title="destinationError"
        icon="i-lucide-triangle-alert"
        color="warning"
        variant="subtle"
      />
    </template>

    <template #footer>
      <span class="min-w-0 truncate text-xs text-muted">
        {{ !isDuplicate && isCurrentFolderSelected ? t('studio.destination.move.sameFolder') : destinationPath }}
      </span>

      <div class="flex shrink-0 gap-2">
        <UButton
          :label="t('studio.aria.cancel')"
          color="neutral"
          variant="ghost"
          :disabled="isSubmitting"
          @click="isOpen = false"
        />
        <UButton
          :label="t(`${i18nPrefix}.submit`)"
          :icon="isDuplicate ? 'i-lucide-copy' : 'i-lucide-folder-input'"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          @click="submitDestination"
        />
      </div>
    </template>
  </UModal>
</template>
