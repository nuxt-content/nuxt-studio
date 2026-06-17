import type { Editor } from '@tiptap/vue-3'
import { findParentNodeClosestToPos } from '@tiptap/core'
import { TableMap, CellSelection } from '@tiptap/pm/tables'
import type { Node } from '@tiptap/pm/model'

export interface TableInfo {
  tableNode: Node
  tablePos: number
  map: ReturnType<typeof TableMap.get>
  tableEl: HTMLTableElement
  wrapperEl: HTMLElement
}

export interface Rect {
  left: number
  width: number
  top: number
  height: number
}

export function findTableInfo(editor: Editor): TableInfo | null {
  const { selection } = editor.state
  const result = findParentNodeClosestToPos(selection.$from, node => node.type.name === 'table')
  if (!result) return null

  const { node: tableNode, pos: tablePos } = result
  const map = TableMap.get(tableNode)
  const dom = editor.view.nodeDOM(tablePos) as HTMLElement | null
  if (!dom) return null

  let tableEl: HTMLTableElement | null
  let wrapperEl: HTMLElement

  if (dom.tagName === 'TABLE') {
    tableEl = dom as HTMLTableElement
    wrapperEl = dom.parentElement || dom
  }
  else if (dom.tagName === 'DIV' && dom.classList.contains('tableWrapper')) {
    wrapperEl = dom
    tableEl = dom.querySelector('table')
  }
  else {
    tableEl = dom.querySelector('table')
    if (!tableEl) return null
    wrapperEl = tableEl.closest('.tableWrapper') as HTMLElement || tableEl.parentElement || dom
  }

  if (!tableEl) return null

  return { tableNode, tablePos, map, tableEl, wrapperEl }
}

export function getColumnRects(tableEl: HTMLTableElement): Rect[] {
  const firstRow = tableEl.rows[0]
  if (!firstRow) return []

  const tableRect = tableEl.getBoundingClientRect()
  return Array.from(firstRow.cells).map((cell) => {
    const cellRect = cell.getBoundingClientRect()
    return {
      left: cellRect.left - tableRect.left,
      width: cellRect.width,
      top: 0,
      height: tableRect.height,
    }
  })
}

export function getRowRects(tableEl: HTMLTableElement): Rect[] {
  const tableRect = tableEl.getBoundingClientRect()
  return Array.from(tableEl.rows).map((row) => {
    const rowRect = row.getBoundingClientRect()
    return {
      left: 0,
      width: tableRect.width,
      top: rowRect.top - tableRect.top,
      height: rowRect.height,
    }
  })
}

export function selectColumn(editor: Editor, info: TableInfo, colIndex: number) {
  const { tablePos, map } = info
  const anchorCellPos = tablePos + 1 + map.map[colIndex]
  const lastRowStart = map.width * (map.height - 1)
  const headCellPos = tablePos + 1 + map.map[lastRowStart + colIndex]

  const $anchor = editor.state.doc.resolve(anchorCellPos)
  const $head = editor.state.doc.resolve(headCellPos)
  const sel = CellSelection.colSelection($anchor, $head)
  editor.view.dispatch(editor.state.tr.setSelection(sel))
}

export function selectRow(editor: Editor, info: TableInfo, rowIndex: number) {
  const { tablePos, map } = info
  const rowStart = map.width * rowIndex
  const anchorCellPos = tablePos + 1 + map.map[rowStart]
  const headCellPos = tablePos + 1 + map.map[rowStart + map.width - 1]

  const $anchor = editor.state.doc.resolve(anchorCellPos)
  const $head = editor.state.doc.resolve(headCellPos)
  const sel = CellSelection.rowSelection($anchor, $head)
  editor.view.dispatch(editor.state.tr.setSelection(sel))
}
