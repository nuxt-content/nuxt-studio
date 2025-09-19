import { DraftStatus, type DatabaseItem, type DraftFileItem, type TreeItem } from '../types'
import { withLeadingSlash } from 'ufo'
import { stripNumericPrefix } from './string'
import type { RouteLocationNormalized } from 'vue-router'

export const ROOT_ITEM: TreeItem = { id: 'root', name: 'content', fsPath: '/', type: 'root' }

export function buildTree(dbItems: DatabaseItem[], draftList: DraftFileItem[] | null):
TreeItem[] {
  const tree: TreeItem[] = []
  const directoryMap = new Map<string, TreeItem>()

  for (const dbItem of dbItems) {
    const fileType = dbItem.path ? 'page' : 'data'
    // Use stem to determine tree structure
    const stemSegments = dbItem.stem.split('/')
    const directorySegments = stemSegments.slice(0, -1)
    let fileName = stemSegments[stemSegments.length - 1]

    let routePathSegments: string[] | undefined
    if (fileType === 'page') {
      routePathSegments = (dbItem.path as string).split('/').slice(0, -1).filter(Boolean)
    }

    /*****************
    Generate root file
    ******************/
    if (directorySegments.length === 0) {
      fileName = fileName === 'index' ? 'home' : stripNumericPrefix(fileName)
      const fsPath = withLeadingSlash(`${dbItem.stem}.${dbItem.extension}`)

      const fileItem: TreeItem = {
        id: dbItem.id,
        name: fileName,
        fsPath,
        type: 'file',
        fileType,
      }

      if (fileType === 'page') {
        fileItem.routePath = dbItem.path as string
      }

      const draftFileItem = draftList?.find(draft => draft.id === dbItem.id)
      if (draftFileItem) {
        fileItem.status = draftFileItem.status
      }

      tree.push(fileItem)
      continue
    }

    /*****************
    Generate directory
    ******************/
    function dirIdBuilder(index: number) {
      const idSegments = dbItem.id.split('/')
      const stemVsIdGap = idSegments.length - stemSegments.length
      return idSegments.slice(0, index + stemVsIdGap + 1).join('/')
    }

    function dirFsPathBuilder(index: number) {
      return withLeadingSlash(directorySegments.slice(0, index + 1).join('/'))
    }

    function dirRoutePathBuilder(index: number) {
      return withLeadingSlash(routePathSegments!.slice(0, index + 1).join('/'))
    }

    let directoryChildren = tree
    for (let i = 0; i < directorySegments.length; i++) {
      const dirName = stripNumericPrefix(directorySegments[i])
      const dirId = dirIdBuilder(i)
      const dirFsPath = dirFsPathBuilder(i)

      // Only create directory if it doesn't exist
      let directory = directoryMap.get(dirId)
      if (!directory) {
        directory = {
          id: dirId,
          name: dirName,
          fsPath: dirFsPath,
          type: 'directory',
          children: [],
        }

        if (fileType === 'page') {
          directory.routePath = dirRoutePathBuilder(i)
        }

        directoryMap.set(dirId, directory)

        if (!directoryChildren.find(child => child.id === dirId)) {
          directoryChildren.push(directory)
        }
      }

      directoryChildren = directory.children!
    }

    /****************************************
    Generate file in directory (last segment)
    ******************************************/
    const fileItem: TreeItem = {
      id: dbItem.id,
      name: stripNumericPrefix(fileName),
      fsPath: withLeadingSlash(`${dbItem.stem}.${dbItem.extension}`),
      type: 'file',
    }

    const draftFileItem = draftList?.find(draft => draft.id === dbItem.id)
    if (draftFileItem) {
      fileItem.status = draftFileItem.status
    }

    if (dbItem.path) {
      fileItem.fileType = 'page'
      fileItem.routePath = dbItem.path as string
    }
    else {
      fileItem.fileType = 'data'
    }

    directoryChildren.push(fileItem)
  }

  calculateDirectoryStatuses(tree)

  return tree
}

export function findParentFromId(tree: TreeItem[], id: string): TreeItem | null {
  for (const item of tree) {
    if (item.children) {
      for (const child of item.children) {
        if (child.id === id) {
          return item
        }
      }

      const foundParent = findParentFromId(item.children, id)
      if (foundParent) {
        return foundParent
      }
    }
  }

  // Not found in this branch
  return null
}

export function findItemFromRoute(tree: TreeItem[], route: RouteLocationNormalized): TreeItem | null {
  for (const item of tree) {
    if (item.routePath === route.path) {
      return item
    }

    if (item.type === 'directory' && item.children) {
      const foundInChildren = findItemFromRoute(item.children, route)
      if (foundInChildren) {
        return foundInChildren
      }
    }
  }

  return null
}

function calculateDirectoryStatuses(items: TreeItem[]) {
  for (const item of items) {
    if (item.type === 'directory' && item.children) {
      calculateDirectoryStatuses(item.children)

      for (const child of item.children) {
        if (child.status) {
          item.status = DraftStatus.Updated
          break
        }
      }
    }
  }
}
