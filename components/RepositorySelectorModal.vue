<template>

  <b-modal id="repository-selector">
    <template #modal-header="{ close }">
      <h5>Github Repository Selector</h5>
    </template>

    <template #default="{ hide }">
      <repository-selector></repository-selector>
    </template>

    <template #modal-footer="{ cancel }">
      <!-- Emulate built in modal footer ok and cancel button actions -->
      <b-button size="sm" variant="success" @click="submit">
        OK
      </b-button>
      <b-button size="sm" variant="danger" @click="cancel()">
        Cancel
      </b-button>
    </template>
  </b-modal>

</template>

<script lang="ts">

import Vue from 'vue'
import RepositorySelector from './RepositorySelector.vue'

export default Vue.extend({
  components: { RepositorySelector },
  name: 'RepositorySelectorModal',
  data: () => ({}),
  computed: {},
  created() {},
  methods: {
    submit() {
      console.log('submit');
      (this as any).$bvModal.hide('repository-selector')
    }
  },
  watch: {}
})

</script>

<style scoped>
</style>
