<template>
  <div>
    <app-header></app-header>

    <div class="breadCrumbs">
      <template v-for="item, idx in breadCrumbs">
        <NuxtLink :to="item.href">
          <span :key="`breadCrumb-${idx}`" v-html="item.label"></span>
        </NuxtLink>
      </template>
    </div>

    <div>
      <span class="dir" v-for="dir, idx in dirs" :key="`dir-${idx}`">
        <NuxtLink :to="dir">
          <span v-html="dir.split('/').pop()"></span>
        </NuxtLink>
      </span>
    </div>

    <ve-image-grid as-cards >
      <ul>
        <li v-for="manifest, idx in manifests" :key="`grid-${idx}`" v-html="manifest"></li>
      </ul>
    </ve-image-grid>

  </div>
</template>

<script lang="ts">

import Vue from 'vue'

const api = 'https://api.juncture-digital.org'
const iiifServer = 'https://iiif.juncture-digital.org'

const fileExtensions = new Set(['yaml','jpg','jpeg','jp2','png','tif','tiff'])
const ignore = new Set(['iiif-props.yaml', 'iiif-props.template.yaml'])

export default Vue.extend({
  name: 'IndexPage',
  data: () => ({
    root: '',
    baseUrl: '',
    dirs: <string[]>[],
    manifests: <any[]>[],
    viewerWindow: null
  }),
  computed: {
    acct(): string {return this.$store.state.acct},
    repo(): string {return this.$store.state.repo},
    path(): string {return this.$store.state.path},
    // root(): string {return this.acct && this.repo ? `${this.acct}/${this.repo}` + (this.path ? `/${this.path}` : '') : ''},
    breadCrumbs(): any[] {
      let breadCrumbs = [{label: 'root', href: `/${this.acct}/${this.repo}`}]
      let pathElems = this.path.split('/').filter(pe => pe)
      for (let i = 0; i < pathElems.length; i++) {
        breadCrumbs.push({label: pathElems[i] ,href: `/${this.acct}/${this.repo}/${pathElems.slice(0,i+1).join('/')}`})
      }
      return breadCrumbs
    }
  },
  async created() {console.log('created')},
  async mounted() {
    console.log(this.$route)
    let pathElems = this.$route.path.split('/').filter(pe => pe)
    this.$store.commit('setPath', pathElems.length > 2 ? pathElems.slice(2).join('/') : '')
    if (pathElems.length > 0) this.$store.commit('setAcct', pathElems[0])
    if (pathElems.length > 1) this.$store.commit('setRepo', pathElems[1])
    this.baseUrl = location.origin
    this.root = this.acct && this.repo ? `${this.acct}/${this.repo}` + (this.path ? `/${this.path}` : '') : ''
    console.log(`${this.$options.name}.mounted acct=${this.acct} repo=${this.repo} path=${this.path} baseUrl=${this.baseUrl} root=${this.root}`)
    if (this.acct && this.repo) window.history.replaceState({}, '', `/${this.root}`)
  },
  methods: {
    async listContents() {
      let url = `${api}/dir/${this.root}/`
      console.log(url)
      await fetch(`${api}/dir/${this.root}/`).then(resp => resp.json())
      .then(items => {
        console.log('items', items)
        let manifests = new Set()
        let dirs: string[] = []
        items.forEach((item:any) => {
          if (item.type === 'dir') {
            dirs.push(`/${this.root}/${item.name}`)
          } else {
            if (!ignore.has(item.name)) {
              let elems = item.name.split('.')
              let name = elems.slice(0,-1).join('.')
              let extension = elems.pop().toLowerCase()
              if (fileExtensions.has(extension)) {                
                manifests.add(`${iiifServer}/gh:${this.root}/${encodeURIComponent(name)}/manifest.json`)
              }
            }
          }
        })
        this.dirs = dirs
        this.manifests = Array.from(manifests).sort()
      })     
    }
  },
  watch: {
    root: {
      async handler(root) {
        console.log(`root=${root}`)
        if (root) this.listContents()
     },
      immediate: true
    },

    dirs(dirs) {
      console.log('dirs', dirs)
    }
  }
})

</script>

<style scoped>
  [v-cloak] {
    display: none
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 12px;
    font-family: Roboto, sans-serif;
  }
  
  .name {
    margin-right: 12px;
    cursor: pointer;
  }    
  
  .name:hover {
    font-weight: bold;
  }
  
  .breadCrumbs {
    display: flex;
    gap: 12px;
  }
  
  .dir {
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 90%;
    margin-bottom: 6px;
    margin-right: 12px;
  }
    
    ve-image-grid {
      margin: 24px 0;
    }

</style>
