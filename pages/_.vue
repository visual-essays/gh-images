<template>
  <div>

    <div class="breadCrumbs">
      <template v-for="item, idx in breadCrumbs">
        <NuxtLink :to="item.href">
          <span :key="`breadCrumb-${idx}`" v-html="item.label"></span>
        </NuxtLink>
      </template>
    </div>

    <div v-if="dirs.length > 0">
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
    baseUrl: '',
    acct: '',
    repo: '',
    path: '',
    dirs: <string[]>[],
    manifests: <any[]>[],
    viewerWindow: null
  }),
  computed: {
    root() {return this.acct && this.repo ? `${this.acct}/${this.repo}` + (this.path ? `/${this.path}` : '') : null},
    breadCrumbs() {
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
    let pathElems = location.pathname.split('/').filter(pe => pe)
    this.path = pathElems.length > 2 ? pathElems.slice(2).join('/') : ''
    this.acct = pathElems.length > 0 ? pathElems[0] : ''
    this.repo = pathElems.length > 1 ? pathElems[1] : ''
    this.baseUrl = location.origin
    console.log(`acct=${this.acct} repo=${this.repo} path=${this.path} baseUrl=${this.baseUrl}`)
  },
  methods: {},
  watch: {
    root: {
      async handler(root) {
        await fetch(`${api}/dir/${this.root}/`).then(resp => resp.json())
        .then(items => {
          console.log(items)
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
      },
      immediate: false
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
