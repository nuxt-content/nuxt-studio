import { ofetch } from 'ofetch'
import type { GithubFile } from '../types/github'
import { createSharedComposable } from '@vueuse/core'

export const useGit = createSharedComposable(({ owner, repo, branch, token, authorName, authorEmail }: { owner: string, repo: string, branch: string, token: string, authorName: string, authorEmail: string }) => {
  const gitFiles: Record<string, GithubFile> = {}

  const $api = ofetch.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  async function fetchFile(path: string, { cached = false }: { cached?: boolean } = {}): Promise<GithubFile | null> {
    if (cached) {
      const file = gitFiles[path]
      if (file) {
        return file
      }
    }

    try {
      const ghFile: GithubFile = await $api(`/repos/${owner}/${repo}/contents/${path}`)
      if (cached) {
        gitFiles[path] = ghFile
      }
      return ghFile
    }
    catch (error) {
      // TODO: Handle error
      alert(error)
      return null
    }
  }

  // function commitFiles(files: { path: string, content: string }[], message: string) {
  //   if (!token) {
  //     return null
  //   }
  //   return commitFilesToGitHub({ owner, repo, branch, token, files, message, authorName, authorEmail })
  // }

  return {
    fetchFile,
    // commitFiles,
  }
})

// export async function commitFilesToGitHub({ owner, repo, branch, token, files, message, authorName, authorEmail }: { owner: string, repo: string, branch: string, token: string, files: { path: string, content: string }[], message: string, authorName: string, authorEmail: string }) {
//   const headers = {
//     Authorization: `Bearer ${token}`,
//     Accept: 'application/vnd.github+json',
//   }

//   // Get latest commit SHA
//   const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers })
//   if (!refRes.ok) throw new Error('Failed to get branch reference')
//   const refData = await refRes.json()
//   const latestCommitSha = refData.object.sha

//   // Get base tree SHA
//   const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers })
//   if (!commitRes.ok) throw new Error('Failed to get latest commit')
//   const commitData = await commitRes.json()
//   const baseTreeSha = commitData.tree.sha

//   // Create blobs and prepare tree
//   const tree = []
//   for (const file of files) {
//     const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({
//         content: file.content,
//         encoding: 'utf-8',
//       }),
//     })
//     if (!blobRes.ok) throw new Error(`Failed to create blob for ${file.path}`)
//     const blobData = await blobRes.json()
//     tree.push({
//       path: file.path,
//       mode: '100644',
//       type: 'blob',
//       sha: blobData.sha,
//     })
//   }

//   // Create new tree
//   const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({
//       base_tree: baseTreeSha,
//       tree,
//     }),
//   })
//   if (!treeRes.ok) throw new Error('Failed to create tree')
//   const treeData = await treeRes.json()

//   // Create new commit
//   const commitRes2 = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({
//       message,
//       tree: treeData.sha,
//       parents: [latestCommitSha],
//       author: {
//         name: authorName,
//         email: authorEmail,
//         date: new Date().toISOString(),
//       },
//     }),
//   })
//   if (!commitRes2.ok) throw new Error('Failed to create commit')
//   const newCommit = await commitRes2.json()

//   // Update branch ref
//   const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
//     method: 'PATCH',
//     headers,
//     body: JSON.stringify({ sha: newCommit.sha }),
//   })
//   if (!updateRes.ok) throw new Error('Failed to update branch reference')

//   return {
//     success: true,
//     commitSha: newCommit.sha,
//     url: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
//   }
// }
