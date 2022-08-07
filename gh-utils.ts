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

}