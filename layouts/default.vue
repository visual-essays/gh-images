<template>
  <div>
        <app-header></app-header>

    <Nuxt />
    <github-file-manager></github-file-manager>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'DefaultLayout',
  created() {
    if ((new URL(location.href)).searchParams.get('code')) window.history.replaceState({}, '', '/')
  }
})
</script>