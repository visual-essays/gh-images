<template>
  <div>
    <app-header></app-header>

    <Nuxt />
    <!--
    <github-file-manager></github-file-manager>
    <github-folder-selector></github-folder-selector>
    -->
    <github-file-selector id="essays-file-selector"></github-file-selector>
    <github-file-selector id="media-file-selector" folders-only></github-file-selector>

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