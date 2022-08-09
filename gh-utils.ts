export class GithubClient {

  authToken: string

  constructor(authToken: string) {
    this.authToken = authToken
  }

  user() {
    return fetch('https://api.github.com/user' ,{
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${this.authToken}`
      }
    }).then(resp => resp.json())
  }

  organizations() {
    return fetch('https://api.github.com/user/orgs' ,{
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${this.authToken}`
      }
    }).then(resp => resp.json())
  }

  repos(user:string = '', org:string = '') {
    let pathPrefix = user
      ? `users/${user}`
      : org
        ? `orgs/${org}`
        : 'user'
    return fetch(`https://api.github.com/${pathPrefix}/repos?per_page=100` ,{
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${this.authToken}`
      }
    }).then(resp => resp.json())
  }

  async putFile(acct:string, repo:string, path:string, content:any, ref:string): Promise<any> {
    console.log(`putFile: acct=${acct} repo=${repo} ref=${ref} path=${path}`)
    let url = `https://api.github.com/repos/${acct}/${repo}/contents/${path}`
    if (ref) url += `?ref=${ref}`
    let payload = { message: 'API commit', ref: ref, content: btoa(content) }
    let resp = await fetch(url, { method: 'PUT', body: JSON.stringify(payload), headers: {Authorization: `Token ${this.authToken}`} })
    resp = await resp.json()
  }

  async deleteFile(acct:string, repo:string, path:string, sha:string): Promise<any> {
    console.log(`deleteFile: acct=${acct} repo=${repo} path=${path} sha=${sha}`)
    let url = `https://api.github.com/repos/${acct}/${repo}/contents/${path}`
    let payload = { message: 'API commit', sha }
    let resp = await fetch(url, { method: 'DELETE', body: JSON.stringify(payload), headers: {Authorization: `Token ${this.authToken}`} })
    resp = await resp.json()
    console.log(resp)
  }

  defaultBranch(acct:string, repo:string) {
    return 'main'
  }

  async dirlist(acct:string, repo:string, path:string, ref:string): Promise<any[]> {
    path = path || ''
    ref = ref || this.defaultBranch(acct, repo)
    let files: any[] = []
    let url = `https://api.github.com/repos/${acct}/${repo}/git/trees/${ref}`
    let headers = {
      Authorization: `Token ${this.authToken}`,
      Accept: 'application/vnd.github.v3+json',
      'If-None-Match': '' // Hack to inhibit response caching
    }
    let pathElems = path.split('/').filter(pe => pe)
    for (let i = 0; i < pathElems.length; i++) {
      let resp = await fetch(url, {headers})
      let _dirList: any = resp.ok ? await resp.json() : {}
      let found = _dirList ? _dirList.tree.find((item:any) => item.path === pathElems[i]) : null
      url = found ? found.url : null
      if (!url) break
    }
    if (url) {
      let resp = await fetch(url, {headers})
      let _dirList: any = resp.ok ? await resp.json() : {}
      files = _dirList.tree.map((item: any) => ({name: item.path, sha: item.sha, type: item.type === 'tree' ? 'dir' : 'file'}))
    }
    return files
  }

  async newFolder(acct:string, repo:string, path:string, ref:string): Promise<any[]> {
    console.log(`newFolder: acct=${acct} repo=${repo} ref=${ref} path=${path}`)
    return this.putFile(acct, repo, `${path}/.deleteMe`, '', ref)
  }

}