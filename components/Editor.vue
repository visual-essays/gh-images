<template>
  <div id="editor">
    
    <div class="controls">
      <div class="breadcrumb">
        <span v-b-tooltip.hover title="Select file" class="select-file-icon" v-b-modal.github-file-selector>
          <fa :icon="folderIcon"></fa>
        </span>
        <b-breadcrumb>
          <b-breadcrumb-item v-for="item, idx in breadCrumbs" :key="`bc-${idx}`" 
            @click="selectFile(item)"
            :html="item.text"
            :disabled="idx === breadCrumbs.length-1"
          ></b-breadcrumb-item>
        </b-breadcrumb>
      </div>

      <div class="buttons">
        <span @click="showHelp" v-b-tooltip.hover title="Show Help Documentation"><fa :icon="helpIcon"></fa></span>
        <span @click="saveFile" v-b-tooltip.hover title="Save Essay"><fa :icon="saveIcon"></fa></span>
        <span @click="copyLink" v-b-tooltip.hover title="Copy Essay Link"><fa :icon="linkIcon"></fa></span>
        <span @click="copyText" v-b-tooltip.hover title="Copy Essay Text"><fa :icon="copyIcon"></fa></span>
        <span @click="launch" v-b-tooltip.hover title="View Essay"><fa :icon="launchIcon"></fa></span>
        <span @click="togglePreview" v-b-tooltip.hover title="Toggle Essay Preview"><fa :icon="previewIcon"></fa></span>
      </div>
    </div>

    <textarea v-cloak ref="content"></textarea>
  </div>
</template>

<script lang="ts">

import Vue from 'vue'

import { faCircleQuestion, faCopy, faEye, faFloppyDisk, faFolderOpen }  from '@fortawesome/free-regular-svg-icons'
import { faArrowUpRightFromSquare, faLink }  from '@fortawesome/free-solid-svg-icons'

const SimpleMDE: any = (window as any).SimpleMDE
const isDev = location.host === 'localhost:5555'
const apiEndpoint = isDev
  ? 'http://localhost:8000'
  : location.hostname === 'localhost'
    ? 'https://api.juncture-digital.org'
    : `https://api.${location.hostname.split('.').slice(1).join('.')}`
const iiifEndpoint = isDev
  ? 'http://localhost:8088'
  : location.hostname === 'localhost'
    ? 'https://iiif.juncture-digital.org'
    : `https://iiif.${location.hostname.split('.').slice(1).join('.')}`
const webappHost = isDev
  ? 'http://localhost:8080'
  : location.hostname === 'editor.juncture-digital.org'
    ? 'https://beta.juncture-digital.org'
    : `https://${location.hostname.split('.').slice(1).join('.')}`
const authEndpoint = isDev
  ? 'https://editor.visual-essays.net/.netlify/identity/token'
  : `https://editor.${location.hostname.split('.').slice(1).join('.')}/.netlify/identity/token`
const wcDevEndpoint = 'http://localhost:3333/build'

const api = 'https://api.juncture-digital.org'

export default Vue.extend({
  name: 'Editor',
  data: () => ({
    contentPath: '',
    content: '',
    simplemde: <any>{},
    isPreviewActive: false,
    loadedDependencies: <any[]>[]
  }),
  computed: {
    baseRoute(): string {return (this.$route.name || '').replace(/-all$/,'').split('/').filter(pe => pe).join('/')},
    acct(): string {return this.$store.state.acct},
    repo(): string {return this.$store.state.repo},
    path(): string {return this.$store.state.path},
    authToken(): string {return this.$store.state.authToken},
    githubClient() {return this.$store.state.githubClient},
    isLoggedIn() {return this.$store.state.authToken !== ''},
    breadCrumbs(): any[] {
      let pathElems = this.contentPath.split('/').filter(pe => pe)
      // let root = `/${this.baseRoute}/${this.acct}/${this.repo}`
      let root = ''
      let breadCrumbs = [{text: 'root', to: root}]
      for (let i = 0; i < pathElems.length; i++) {
        breadCrumbs.push({text: pathElems[i], to: `${root}/${pathElems.slice(0,i+1).join('/')}`})
      }
      return breadCrumbs
    },
    launchIcon() { return faArrowUpRightFromSquare },
    helpIcon() { return faCircleQuestion },
    copyIcon() { return faCopy },
    previewIcon() { return faEye },
    saveIcon() { return faFloppyDisk },
    folderIcon() { return faFolderOpen },
    linkIcon() { return faLink }
  },
  async created() {
  },
  async mounted() {
    this.initEditor()
    this.$root.$on('github-path-changed', (path: string) => {
      path = path.replace(/\/README\.md$/,'').replace(/\.md$/,'')
      this.$store.commit('setPath', path)
      this.$router.push({path: `/${this.baseRoute}/${this.acct}/${this.repo}/${path}`})
    })
    
    let pathElems = (this.$route.params?.pathMatch || '').split('/').filter(pe => pe)
    this.$store.commit('setPath', pathElems.length > 2 ? pathElems.slice(2).join('/') : '')
    if (pathElems.length > 0) this.$store.commit('setAcct', pathElems[0])
    if (pathElems.length > 1) this.$store.commit('setRepo', pathElems[1])
    this.contentPath = await this.githubClient.fullPath(this.acct, this.repo, this.path)
    this.content = await this.githubClient.getFile(this.acct, this.repo, this.contentPath)
    console.log(`${this.$options.name}.mounted acct=${this.acct} repo=${this.repo} path=${this.path} contentPath=${this.contentPath}`)
    
  },
  methods: {
    selectFile(item:any) {
      this.$store.commit('setFileSelectorPath', item.to)
      ;(this as any).$bvModal.show('github-file-selector')
    },

    initEditor() {
        this.simplemde = new SimpleMDE({
          previewRender: this.previewRender,
          // initialValue,
          autosave: {
            enabled: true,
            delay: 10000,
            // uniqueId: this.userHash
            uniqueId: 'aaaa'
          },
          hideIcons: ['side-by-side', 'fullscreen', 'preview', 'guide'],
          tabSize: 4
        })
        this.simplemde.codemirror.on('drop', (_:any, evt:MouseEvent) => evt.preventDefault())
        this.simplemde.codemirror.on('drop', (_:any, evt:MouseEvent) => evt.preventDefault())
      },

    previewRender(markdown:string, preview:HTMLElement) {
      if (this.isPreviewActive) {
        this.loadedDependencies.forEach(el => el.parentElement.removeChild(el))
        this.loadedDependencies = []
      } else {
        let body = {'prefix': `${this.acct}/${this.repo}`, 'markdown': markdown}
        fetch(`${apiEndpoint}/html/?inline=true`, {method: 'POST', body: JSON.stringify(body)})
          .then(resp => resp.text())
          .then(html => {
            let htmlEls = new DOMParser().parseFromString(html, 'text/html').children[0].children
            let head = (htmlEls[0] as HTMLElement)
            let body = (htmlEls[1] as HTMLElement)
            Array.from(body.querySelectorAll('ve-image')).forEach((veImg:any) => veImg.setAttribute('auth-token', this.authToken))
            preview.innerHTML = body.innerHTML
            this.loadDependencies(head.querySelectorAll('link[rel="stylesheet"]'), 0, () => this.loadDependencies(head.querySelectorAll('style'), 0, null))
            this.loadDependencies(body.querySelectorAll('script'), 0, null)
          })
        return ''
      }
    },

    togglePreview() {
      SimpleMDE.togglePreview(this.simplemde)
      this.isPreviewActive = !this.isPreviewActive
    },
    
    showHelp() {
      console.log('showHelp')
    },
  
    saveFile() {
      console.log('saveFile')
    },
  
    copyLink() {
      console.log('copyLink')
    },
  
    copyText() {
      console.log('copyText')
    },
  
    launch() {
      console.log('launch')
    },
  
    loadDependencies(dependencies:any, i:number, callback:any) {
      if (dependencies.length > 0) {
        this.load(dependencies.item(i), () => {
          if (i < dependencies.length-1) this.loadDependencies(dependencies, i+1, callback) 
          else if (callback) callback()
        })
      }
    },

    load(srcEl:HTMLElement, callback:any) {
      let e
      if (srcEl.localName  === 'link') {
        e = document.createElement('link')
        e.href = isDev
          ? (srcEl as HTMLLinkElement).href.replace(/https:\/\/unpkg\.com\/visual-essays\/dist\/visual-essays/, wcDevEndpoint)
          : (srcEl as HTMLLinkElement).href
        e.rel = (srcEl as HTMLLinkElement).rel
        e.type = 'text/css'
        e.addEventListener('load', callback)
        this.loadedDependencies.push(e)
        document.getElementsByTagName('head')[0].appendChild(e)
      } else if (srcEl.localName  === 'style') {
        e = document.createElement('style')
        e.textContent = srcEl.textContent
        e.addEventListener('load', callback)
        this.loadedDependencies.push(e)
        document.getElementsByTagName('head')[0].appendChild(e)
      } else if (srcEl.localName  === 'script') {
        e = document.createElement('script')
        if ((srcEl as HTMLScriptElement).src) {
          e.src = isDev
            ? (srcEl as HTMLScriptElement).src.replace(/https:\/\/unpkg\.com\/visual-essays\/dist\/visual-essays/, wcDevEndpoint)
            : (srcEl as HTMLScriptElement).src
          if ((srcEl as HTMLScriptElement).type) e.type = (srcEl as HTMLScriptElement).type
          e.addEventListener('load', callback)
        } else {
          if ((srcEl as HTMLScriptElement).type) e.type = (srcEl as HTMLScriptElement).type
          e.text = (srcEl as HTMLScriptElement).text
        }
        this.loadedDependencies.push(e)
        document.getElementsByTagName('body')[0].appendChild(e)
        if (!e.src) callback()
      }
    },

  },
  watch: {
    content(markdown) {
      this.simplemde.value(markdown)
    },
    isPreviewActive(isActive) {
      if (isActive) this.$refs.main.classList.add('preview')
      else this.$refs.main.classList.remove('preview')
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
  
  #editor {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  body {
    margin: 12px;
    font-family: Roboto, sans-serif;
  }
  
      .preview .editor-toolbar, .preview .editor-statusbar, .preview .file-selector, .preview .toolbar {display: none}

  .select-file-icon {
    font-size: 24px;
  }

  .content {
    padding: 12px;
  }

  .controls {
    display: flex;
    align-items: center;
  }
  .breadcrumb {
    display: flex;
    align-items: center;
    margin: 0;
    height: 40px;
    padding: 0 0 0 18px;
    background-color: white;
  }
  .buttons {
    padding: 12px;
    display: flex;
    gap: 9px;
    margin-left: auto;
    font-size: 20px;
  }

</style>
