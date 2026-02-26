<script setup lang="ts">
const props = defineProps<{
  name: string
  dev?: boolean
}>()

const packageManagers = [
  { name: 'pnpm', command: 'pnpm', install: 'add ', devInstall: 'add -D ', run: '', x: 'pnpm dlx ' },
  { name: 'yarn', command: 'yarn', install: 'add ', devInstall: 'add -D ', run: '', x: 'yarn dlx ' },
  { name: 'npm', command: 'npm', install: 'install ', devInstall: 'install -D ', run: 'run ', x: 'npx ' },
  { name: 'bun', command: 'bun', install: 'add ', devInstall: 'add -D ', run: 'run ', x: 'bunx ' },
  { name: 'deno', command: 'deno', install: 'add npm:', devInstall: 'add -D npm:', run: 'run ', x: 'deno run -A npm:' },
  { name: 'auto', command: 'npx nypm', install: 'add ', devInstall: 'add -D ', run: 'run ', x: 'npx ' },
] as const

const codeBlocks = computed(() =>
  packageManagers.map(pm => ({
    filename: pm.name,
    code: `${pm.command} ${props.dev ? pm.devInstall : pm.install}${props.name}`,
  })),
)
</script>

<template>
  <ProseCodeGroup sync="pm">
    <ProsePre
      v-for="codeBlock in codeBlocks"
      :key="codeBlock.filename"
      v-bind="codeBlock"
    >
      <span style="color: var(--ui-primary)">{{ codeBlock.code.split(' ')[0] }}</span>
      <span style="color: var(--ui-text)">&nbsp;{{ codeBlock.code.split(' ').slice(1).join(' ') }}</span>
    </ProsePre>
  </ProseCodeGroup>
</template>
