<template>
  <div id="editor">
    
    <div class="controls">
      <content-path></content-path>

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

const apiEndpoint = process.env.isDev
  ? 'http://localhost:8000'
  : location.hostname === 'localhost'
    ? 'https://api.juncture-digital.org'
    : `https://api.${location.hostname.split('.').slice(1).join('.')}`
const wcDevEndpoint = 'http://localhost:3333/build'

export default Vue.extend({
  name: 'Editor',
  data: () => ({
    content: '',
    simplemde: <any>{},
    isPreviewActive: false,
    loadedDependencies: <any[]>[]
  }),
  computed: {
    acct(): string {return this.$store.state.essaysAcct},
    repo(): string {return this.$store.state.essaysRepo},
    contentPath(): string {return this.$store.state.essaysContentPath},
    authToken(): string {return this.$store.state.authToken},
    githubClient() {return this.$store.state.githubClient},
    
    launchIcon() { return faArrowUpRightFromSquare },
    helpIcon() { return faCircleQuestion },
    copyIcon() { return faCopy },
    previewIcon() { return faEye },
    saveIcon() { return faFloppyDisk },
    folderIcon() { return faFolderOpen },
    linkIcon() { return faLink }
  },
  created() { console.log(`${this.$options.name}.created`)},
  async mounted() {
    if (this.acct && this.repo) {
      console.log(`essaysAcct=${this.acct} essaysRepo=${this.repo} essaysContentPath=${this.contentPath}`)
      let path = ['essays', this.acct, this.repo, ...this.contentPath.replace(/\/README\.md$/,'').replace(/\.md$/,'').split('/')].filter(pe => pe).join('/')
      window.history.replaceState({}, '', `/${path}`)
    }
    this.initEditor()
  },
  methods: {

    initEditor() {
      this.simplemde = new SimpleMDE({
        previewRender: this.previewRender,
        // initialValue,
        autosave: {
          enabled: false,
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
        e.href = process.env.isDev
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
          e.src = process.env.isDev
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
    contentPath: {
      async handler (contentPath) {
        let path = ['essays', this.acct, this.repo, ...this.contentPath.replace(/\/?README\.md$/,'').replace(/\.md$/,'').split('/')].filter(pe => pe).join('/')
        window.history.replaceState({}, '', `/${path}`)
        this.content = contentPath
          ? await this.githubClient.getFile(this.acct, this.repo, contentPath)
          : ''
      },
      immediate: true
    },
    content(markdown) {
      this.simplemde.value(markdown)
    },
    /*
    isPreviewActive(isActive) {
      if (isActive) this.$refs.main.classList.add('preview')
      else this.$refs.main.classList.remove('preview')
    }
    */
  }
})

</script>

<style>

  .CodeMirror {
    height: calc(100vh - 200px);
  }

</style>

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
    height: 100%;
  }

  body {
    margin: 12px;
    font-family: Roboto, sans-serif;
  }
  
  .preview .editor-toolbar,
  .preview .editor-statusbar,
  .preview .file-selector,
  .preview .toolbar {
    display: none;
  }

  .content {
    padding: 12px;
  }

  .controls {
    display: flex;
    align-items: center;
  }

  .buttons {
    padding: 12px;
    display: flex;
    gap: 9px;
    margin-left: auto;
    font-size: 20px;
  }

</style>
