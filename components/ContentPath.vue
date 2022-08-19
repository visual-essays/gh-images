<template>
  <div class="main">

    <div class="repo-selector" v-if="acct" 
      @click="selectRepository"
      v-b-tooltip.hover :title="isMobile ? '' : 'Select Repository'">
      <span v-html="acct"></span>:
      <span v-html="repo"></span>
    </div>
    <div v-else>
      <div class="repo-selector" @click="selectRepository">Select Repository</div>
    </div>

    <div class="breadcrumb">
      <b-breadcrumb v-if="acct">
        <b-breadcrumb-item v-for="item, idx in breadCrumbs" :key="`bc-${idx}`" 
          @click="selectFile(item)"
          :html="item.text"
        ></b-breadcrumb-item>
      </b-breadcrumb>
    </div>

  </div>
</template>

<script lang="ts">

import Vue from 'vue'

export default Vue.extend({
  name: 'ContentPath',
  props: {
    tool: { type: String, default: 'essays' }
  },
  data: () => ({}),
  computed: {
    baseRoute(): string {return (this.$route.name || '').replace(/-all$/,'').split('/').filter(pe => pe).join('/')},
    toolTitleCase(): string {return this.tool.charAt(0).toUpperCase() + this.tool.slice(1).toLowerCase()},
    acct(): string {return this.$store.state[`${this.tool}Acct`]},
    repo(): string {return this.$store.state[`${this.tool}Repo`]},
    path(): string {return this.$store.state[`${this.tool}Path`]},
    contentPath(): string {return this.$store.state[`${this.tool}ContentPath`]},
    githubClient(): any {return this.$store.state.githubClient},
    isMobile(): boolean {return this.$store.state.isMobile},
    breadCrumbs(): any[] {
      let root = ''
      let breadCrumbs = [{text: 'root', to: root}]
      // let breadCrumbs = []
      let pathElems = this.contentPath.split('/').filter(pe => pe)
      for (let i = 0; i < pathElems.length; i++) {
        breadCrumbs.push({text: pathElems[i], to: `${root}/${pathElems.slice(0,i+1).join('/')}`})
      }
      return breadCrumbs
    }
  },
  created() {},
  mounted() {

    this.$root.$on('github-path-changed', (path: string) => {
      console.log(`github-path-changed: tool=${this.tool} path=${path}`)
      path = path.replace(/\/README\.md$/,'').replace(/\.md$/,'')
      this.$store.commit(`set${this.toolTitleCase}ContentPath`, path)
      this.$router.push({path: `/${this.baseRoute}/${this.acct}/${this.repo}/${path}`})
    })
    
    let pathElems = (this.$route.params?.pathMatch || '').split('/').filter(pe => pe)

    if (pathElems.length > 2) {
      this.$store.commit(`set${this.toolTitleCase}Path`, pathElems.length > 2 ? pathElems.slice(2).join('/') : '')
    }
    if (pathElems.length > 0) this.$store.commit(`set${this.toolTitleCase}Acct`, pathElems[0])
    if (pathElems.length > 1) this.$store.commit(`set${this.toolTitleCase}Repo`, pathElems[1])
    console.log(`${this.$options.name}.mounted acct=${this.acct} repo=${this.repo} path=${this.path} contentPath=${this.contentPath}`)
  },
  methods: {

    selectFile(item:any) {
      console.log('selectFile', this.tool)
      this.$store.commit('setFileSelectorPath', item.to)
      ;(this as any).$bvModal.show(`${this.tool}-file-selector`)
    },

    selectRepository() {
      (this as any).$bvModal.show(`${this.tool}-repository-selector`)
    }

  },
  watch: {
  
    acct: {
      async handler(acct) {
        this.$store.commit(`set${this.toolTitleCase}ContentPath`, '')
        if (acct) this.$store.commit(`set${this.toolTitleCase}ContentPath`, await this.githubClient.fullPath(this.acct, this.repo, this.path)) 
      },
      immediate: false
    },

    repo: {
      async handler(repo) {
        this.$store.commit(`set${this.toolTitleCase}ContentPath`, '')
        if (repo) this.$store.commit(`set${this.toolTitleCase}ContentPath`, await this.githubClient.fullPath(this.acct, this.repo, this.path)) 
      },
      immediate: false
    },

    path: {
      async handler(repo) {
        this.$store.commit(`set${this.toolTitleCase}ContentPath`, '')
        if (repo) this.$store.commit(`set${this.toolTitleCase}ContentPath`, await this.githubClient.fullPath(this.acct, this.repo, this.path)) 
      },
      immediate: false
    },

    conrentPath() {
      let path = ['media', this.acct, this.repo, ...this.contentPath.split('/')].filter(pe => pe).join('/')
      window.history.replaceState({}, '', `/${path}`)
    }

  }
})

</script>

<style scoped>

  .main {
    display: flex;
    align-items: center;
    padding: 6px;
  }

  .repo-selector {
    cursor: pointer;
  }
  .repo-selector:hover {
    text-decoration: underline;
  }
  .repo-selector span {
    font-size: 1.2rem;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    margin: 0;
    height: 40px;
    padding: 0 0 0 18px;
    background-color: white;
  }

</style>
