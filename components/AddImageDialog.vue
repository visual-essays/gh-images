<template>
  <b-modal id="add-image">
    <template #modal-header="{ close }">
      <h5>Add Image</h5>
    </template>

    <template #default="{ hide }">
      <input ref="filePicker" type="file" accept="image/x-png,image/jpeg,image/gif" @change="fileSelected"/>
      <div>
        <img style="height:100px" :src="imageUrl">
      </div>
      <div v-if="file">
        <label for="fname">File name:</label>
        <input type="text" ref="fname" id="fname" name="fname" :value="file.name"><br>
      </div>
    </template>

    <template #modal-footer="{ cancel }">
      <!-- Emulate built in modal footer ok and cancel button actions -->
      <b-button size="sm" variant="primary" @click="upload">
        Add
      </b-button>
      <b-button size="sm" @click="cancel()">
        Cancel
      </b-button>
    </template>
  </b-modal>

</template>

<script lang="ts">

import Vue from 'vue'
import { GithubClient } from '../gh-utils'

export default Vue.extend({
  name: 'AddImage',
  data: () => ({
    file: <File>{},
    imageUrl: '',
    ref: ''
  }),
  computed: {
    acct(): string {return this.$store.state.acct},
    repo(): string {return this.$store.state.repo},
    isLoggedIn() {return this.$store.state.authToken !== ''},
    githubClient() {return this.$store.state.githubClient}
  },
  created() {},
  methods: {

    fileSelected() {
      let filePicker = this.$refs.filePicker as HTMLInputElement
      if (filePicker && filePicker.files && filePicker.files.length > 0) {
        this.file = filePicker.files[0]
        let urlCreator = window.URL || window.webkitURL
        this.imageUrl = urlCreator.createObjectURL(this.file)
      }
    },

    async upload() {
      let file: File
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64data = reader.result 
        await this.githubClient.putFile(this.acct, this.repo, file.name, base64data);
        (this as any).$bvModal.hide('add-image')
      }

      const filePicker = document.querySelector('input')
      if (filePicker && filePicker.files && filePicker.files.length > 0) {
        file = filePicker.files[0]
        reader.readAsBinaryString(file)
      }
    }

  },

  watch: {}
})

</script>

<style scoped>
</style>
