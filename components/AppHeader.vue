<template>
<div>
  <b-navbar ref="navbar" fixed="top" toggleable="lg" type="dark" variant="primary">
    <b-navbar-brand to="/">Github Images</b-navbar-brand>
    
    <div class="repo-selector" v-if="acct" 
      v-b-modal.repository-selector 
      v-b-tooltip.hover title="Select Repository">
      <span v-html="acct"></span>:
      <span v-html="repo"></span>
    </div>
    <div v-else>
      <div class="repo-selector" v-b-modal.repository-selector>Select Repository</div>
    </div>
    
    <b-collapse id="nav-collapse" is-nav>
      <!-- Inline nav items -->
      <b-navbar-nav>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-nav-item v-if="isLoggedIn" @click="logout">Logout</b-nav-item>
        <b-nav-item v-else  @click="login">Login</b-nav-item>
      </b-navbar-nav>

    </b-collapse>
  </b-navbar>
  <div style="height:56px;"></div>

  <div>
    <b-modal id="modal-1" title="Github Repository Selector">
      <repository-selector></repository-selector>
    </b-modal>
  </div>

  <repository-selector></repository-selector>

</div>
</template>

<script lang="ts">

import Vue from 'vue'

export default Vue.extend({
  name: 'AppHeader',
  data: () => ({}),
  computed: {
    acct() {return this.$store.state.acct},
    repo() {return this.$store.state.repo},
    isLoggedIn() {return this.$store.state.authToken !== ''}
  },
  methods: {

    login() { window.location.href = `https://github.com/login/oauth/authorize?client_id=f30ce4168a0bb95ecaa3&scope=repo&state=some_state&redirect_uri=${location.href}` },
    logout() { this.$store.commit('clearAuthToken') }

  },
  watch: {}
})

</script>

<style scoped>
  .repo-selector {
    cursor: pointer;
    color: white;
  }
  .repo-selector:hover {
    text-decoration: underline;
  }
  .repo-selector span {
    font-size: 1.2rem;
  }

</style>
