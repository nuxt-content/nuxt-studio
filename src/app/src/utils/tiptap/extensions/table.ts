import { Table as TiptapTable } from '@tiptap/extension-table'
import TiptapTableRow from '@tiptap/extension-table-row'
import TiptapTableCell from '@tiptap/extension-table-cell'
import TiptapTableHeader from '@tiptap/extension-table-header'

export const Table = TiptapTable.configure({
  resizable: false,
  HTMLAttributes: { class: 'studio-table' },
})
export const TableRow = TiptapTableRow
export const TableCell = TiptapTableCell
export const TableHeader = TiptapTableHeader
