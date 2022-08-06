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

}