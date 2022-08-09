<template>
  <b-modal id="add-image">

    <template #modal-header="{ close }">
      <h5>Add Image</h5>
    </template>

    <template #default="{ hide }">

      <b-button-group v-if="dirs.length > 0" size="sm" class="dir">
        <b-button v-for="dir in dirs" :key="dir" :to="dir" pill>
          <fa :icon="faFolder" title="Folder"></fa>{{dir.split('/').pop()}}
        </b-button>
      </b-button-group>

      <div>
        <img v-if="imageUrl" ref="img" style="height:150px" :src="imageUrl">
      </div>

      <b-container v-if="file.name" fluid class="image-data">
        <b-row>
          <b-col sm="3" class="label"><label for="folder">Folder:</label></b-col>
          <b-col sm="9" class="value">
            <b-form-input type="text" ref="folder" id="folder" name="folder" :value="folder"></b-form-input>
            <b-button size="sm" variant="outline-primary" v-b-modal.github-file-manager>Change</b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="3" class="label"><label for="fname">Name:</label></b-col>
          <b-col sm="9" class="value">
            <b-form-input type="text" ref="fname" id="fname" name="fname" model="fileName"></b-form-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col sm="3" class="label"><label for="summary">Summary:</label></b-col>
          <b-col sm="9" class="value">
            <b-form-input type="text" ref="summary" id="summary" name="summary" :value="summary"></b-form-input>
          </b-col>
        </b-row>
      </b-container>

      <input v-else ref="filePicker" type="file" accept="image/x-png,image/jpeg,image/gif" @change="fileSelected"/>
    
    </template>

    <template #modal-footer="{ cancel }">
      <b-button v-if="fileName" size="sm" variant="primary" @click="add">Add</b-button>
      <b-button size="sm" @click="cancel()">Cancel</b-button>
    </template>

  </b-modal>
</template>

<script lang="ts">

import Vue from 'vue'
import EXIF from 'exif-js'
import { faFolder }  from '@fortawesome/free-regular-svg-icons'
import GithubFileSelector from './GithubFileManager.vue'

export default Vue.extend({
  components: { GithubFileSelector },
  name: 'AddImage',
  data: () => ({
    dirList: <any[]>[],
    folder: <string>'',
    file: <File>{},
    fileName: <string>'',
    fileExtension: <string>'',
    summary: <string>'',
    imageUrl: '',
    ref: ''
  }),
  computed: {
    acct(): string {return this.$store.state.acct},
    repo(): string {return this.$store.state.repo},
    path(): string {return this.$store.state.path},
    isLoggedIn() {return this.$store.state.authToken !== ''},
    githubClient() {return this.$store.state.githubClient},
    dirs() {return this.dirList.filter(item => item.type === 'dir').map(item => item.name)},
    files() {return this.dirList.filter(item => item.type === 'dir').map(item => item.name)},
    faFolder() { return faFolder }
  },
  async mounted() {
    this.$root.$on('bv::modal::show', this.onOpen)
    this.$root.$on('bv::modal::hide', this.onClose)
    this.$root.$on('path-changed', (path: string) => this.folder = path)
  },
  methods: {

    fileSelected() {
      let filePicker = this.$refs.filePicker as HTMLInputElement
      if (filePicker && filePicker.files && filePicker.files.length > 0) {
        this.file = filePicker.files[0]
        let parts: string[] = this.file.name.split('.')
        // this.fileName = parts.slice(0,-1).join('.')
        this.fileExtension = parts.slice(-1)[0].toLowerCase()
        console.log(`name=${this.fileName} extension=${this.fileExtension}`)
        let urlCreator = window.URL || window.webkitURL
        this.imageUrl = urlCreator.createObjectURL(this.file)
      }
    },

    onOpen() {
      this.folder = this.path
      this.githubClient.dirlist(this.acct, this.repo, this.path).then((dirList:any[]) => this.dirList = dirList)
    },

    onClose(evt:any, modalId:string) {
      console.log(`onClose: modal=${modalId}`)
      if (modalId === 'add-image') {
        this.file = ({} as File)
        this.imageUrl = ''
        this.folder = ''
        this.summary = ''
        this.fileName = ''
        this.fileExtension = ''
      }
    },

    async add() {
      console.log('add')
      let metadata = await this.getExifTags()
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64data = reader.result 
        let fileName = this.fileName.replace(/ /g, '_')
        let path = [...this.folder.split('/').filter(pe => pe), ...[fileName]].join('/')
        console.log(`add: ${path}`);
        await this.githubClient.putFile(this.acct, this.repo, `${path}.${this.fileExtension}`, base64data)
        if (metadata)
          await this.githubClient.putFile(this.acct, this.repo, `${path}.yaml`, this.toYaml(metadata));
        (this as any).$bvModal.hide('add-image')
      }
      reader.readAsBinaryString(this.file)
    },

    toYaml(obj:any) {
      return Object.entries(obj).map(arg => `${arg[0]}: ${arg[1]}`).join('\n') + '\n'
    },

    async getExifTags() {
      function gpsCoords (coords:any, ref:any) {
        let decimal_degrees = coords[0] + coords[1] / 60 + coords[2] / 3600
        if (ref === 'S' || ref === 'W') {
          decimal_degrees = -decimal_degrees
        }
        return decimal_degrees.toFixed(8)
      }

      return new Promise((resolve, reject) => {
        let img: any = this.$refs.img
        let data:any        
        EXIF.getData(img, () => {
          let tags = EXIF.getAllTags(img)
          if (tags) {
            data = {}
            if (tags.GPSLatitude) {
              let lat = gpsCoords(tags.GPSLatitude, tags.GPSLatitudeRef)
              let lon = gpsCoords(tags.GPSLongitude, tags.GPSLongitudeRef)
              data.location = `${lat},${lon}`
            }
            if (tags.DateTime) data.created = tags.DateTime
            if (tags.Orientation) data.orientation = tags.Orientation
            if (tags.PixelXDimension) data.width = tags.PixelXDimension
            if (tags.PixelYDimension) data.height = tags.PixelYDimension
            if (tags.Model) data.model = tags.Model
          }
          resolve(data)
        })
      })
    }

  },

  watch: {}
})

</script>

<style scoped>
  .dir.btn-group {
    width: 100%;
    background-color: #e9ecef;
  }
  .dir.btn-group .btn {
    color: black;
    background-color: white;
    margin: 0 0 .5rem .5rem;
    flex: none;
  }
  .dir svg {
    margin-right: 6px;
  }

  .image-data {
    margin-top: 12px;
  }
  .image-data .label {
    padding: 8px 0 0 0;
    font-weight: bold;
  }  
  .image-data .value {
    display: flex;
    padding-left: 0;
  }
  .image-data .value .btn {
    height: calc(1.5em + 0.75rem + 4px);
  }
</style>
