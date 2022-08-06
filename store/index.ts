import { GithubClient } from '../gh-utils'

export const state = () => ({
  acct: localStorage.getItem('gh-acct') || '',
  repo: localStorage.getItem('gh-repo') || '',
  path: localStorage.getItem('gh-path') || '',
  unscopedToken: localStorage.getItem('gh-unscoped-token') || '',
  authToken: localStorage.getItem('gh-auth-token') || '',
  githubClient: GithubClient
})
  
export const mutations = {
  setAcct (state: any, acct: string) {
    state.acct = acct
    if (acct) localStorage.setItem('gh-acct', acct)
    else localStorage.removeItem('gh-acct')
  },
  setRepo (state: any, repo: string) {
    state.repo = repo
    if (repo) localStorage.setItem('gh-repo', repo)
    else localStorage.removeItem('gh-repo')
  },
  setPath (state: any, path: string) {
    state.path = path
    if (path) localStorage.setItem('gh-path', path)
    else localStorage.removeItem('gh-path')
  },
  
  setUnscopedToken (state: any, token: string) {
    state.unscopedToken = token
    if (token) {
      localStorage.setItem('gh-unscoped-token', token)
      state.githubClient = new GithubClient(state.authToken || state.unscopedToken)
    } else {
      localStorage.removeItem('gh-unscoped-token')
      state.githubClient = state.authToken ? new GithubClient(state.authToken) : null
    }
  },

  setAuthToken (state: any, token: string) {
    state.authToken = token
    if (token) {
      localStorage.setItem('gh-auth-token', token)
      state.githubClient = new GithubClient(state.authToken)
    } else {
      localStorage.removeItem('gh-auth-token')
      state.githubClient = state.unscopedToken ? new GithubClient(state.unscopedToken) : null
    }
  },
  clearAuthToken (state: any) {
    state.authToken = ''
    localStorage.removeItem('gh-auth-token')
    if (state.unscopedToken) state.githubClient = new GithubClient(state.unscopedToken)
  },

  setGithubClient (state: any) {
    let token = state.authToken || state.unscopedToken
    state.githubClient = token ? new GithubClient(token) : null
  }

}
  