<script setup>
definePageMeta({
  layout: '',
})
const { loggedIn, user, clear, openInPopup } = useUserSession()

watch(loggedIn, (newVal) => {
  if (newVal) {
    navigateTo('/')
  }
})
</script>

<template>
  <div v-if="loggedIn">
    <h1>Welcome {{ user.name }}!</h1>
    <button @click="clear">
      Logout
    </button>
  </div>
  <UCard
    v-else
    :ui="{ body: 'flex flex-col gap-4' }"
    class="max-w-md mx-auto"
  >
    <h1>Not logged in</h1>
    <UButton
      block
      icon="i-simple-icons-github"
      @click="openInPopup('/_admin/auth/github')"
    >
      Login with GitHub
    </UButton>
    <UButton
      block
      icon="i-simple-icons-google"
      @click="openInPopup('/_admin/auth/google')"
    >
      Login with Google
    </UButton>
  </UCard>
</template>
