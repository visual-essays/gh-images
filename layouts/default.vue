<template>
  <Nuxt />
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