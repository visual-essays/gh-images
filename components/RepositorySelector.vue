<template>
  <b-modal id="repository-selector">
    <template #modal-header="{ close }">
      <h5>Github Repository Selector</h5>
    </template>

    <template #default="{ hide }">
      <div v-if="isLoggedIn">
        <b-form-checkbox
          id="mode-cb"
          v-model="mode"
          name="mode"
          value="mine"
          unchecked-value="any"
        >
        My Github account and organizations
        </b-form-checkbox><br>
      </div>

      <b-input-group>
      <b-form-select
          v-if="mode === 'mine'"
          v-model="selectedAcct"
          :options="accounts"
          value-field="login"
          text-field="login"
        ></b-form-select>
        
        <b-form-input v-else
          id="acctInput"
          autocapitalize="off"
          placeholder="Enter user or account"
          @keyup="acctInputHandler"
          :value="selectedAcct"
        ></b-form-input>

        <b-form-select
          v-model="selectedRepo"
          :options="repositories"
          value-field="name"
          text-field="name"
        ></b-form-select>`
      </b-input-group>
    </template>

    <template #modal-footer="{ cancel }">
      <!-- Emulate built in modal footer ok and cancel button actions -->
      <b-button size="sm" variant="primary" @click="submit">
        Submit
      </b-button>
      <b-button size="sm" @click="cancel()">
        Cancel
      </b-button>
    </template>
  </b-modal>

</template>

<script lang="ts">

import Vue from 'vue'
import _ from 'lodash'

export default Vue.extend({
  name: 'RepositorySelector',
  data: () => ({
    mode: <string>'mine',
    selectedAcct: <string>'',
    selectedRepo: <string>'',
    accounts: <any[]>[],
    repositories: <any[]>[]
  }),
  computed: {
    acct(): string {return this.$store.state.acct},
    repo(): string {return this.$store.state.repo},
    isLoggedIn() {return this.$store.state.authToken !== ''},
    githubClient() {return this.$store.state.githubClient}
  },
  created() {
    this.acctInputHandler = <any>_.debounce(this.acctInputHandler, 500)
  },
  methods: {
    
    async getAccounts(): Promise<string[]> {
      return await Promise.all([this.githubClient.user(), this.githubClient.organizations()])
      .then(responses => responses.flat())
    },
    
    async getRepositories(acct:string): Promise<string[]> {
      return this.githubClient.repos(acct)
    },
    
    async acctInputHandler() {
      this.selectedAcct = (document.getElementById('acctInput') as HTMLInputElement).value
      this.repositories = this.selectedAcct
        ? await this.getRepositories(this.selectedAcct)
        : []
      this.selectedRepo = this.repositories.length
        ? (this.repositories.find((repo:any) => repo.name.toLowerCase() === 'images') || this.repositories[0]).name
        : []
    },

    async getMyRepositories() {
      if (this.isLoggedIn) {
        this.accounts = await this.getAccounts()
        this.selectedAcct = this.selectedAcct || this.accounts[0].login
        this.repositories = await this.getRepositories(this.selectedAcct)
      }
    },

    submit() {
      (this as any).$bvModal.hide('repository-selector')
      this.$store.commit('setAcct', this.selectedAcct)
      this.$store.commit('setRepo', this.selectedRepo)
      this.$store.commit('setPath', '')
      this.$router.push({path: `/${this.acct}/${this.repo}`})
    }

  },

  watch: {
    
    mode(mode) {
      if (mode === 'mine') this.getMyRepositories()
    },

    isLoggedIn: {
      async handler(isLoggedIn) {
        this.mode = isLoggedIn ? 'mine' : 'any'
        if (isLoggedIn) this.getMyRepositories()
      },
      immediate: true
    },
    
    acct: {
      async handler() {
        this.selectedAcct = this.acct
      },
      immediate: true
    },

    selectedAcct: {
      async handler () {
        this.repositories = await this.getRepositories(this.selectedAcct)
      },
      immediate: true
    },
  
    repositories() {
      this.selectedRepo = this.repositories.length
        ? (this.repositories.find((repo:any) => repo.name.toLowerCase() === 'images') || this.repositories[0]).name
        : ''
    }
  }
})

</script>

<style scoped>
</style>
