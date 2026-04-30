import { Table as TiptapTable, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'

export const Table = TiptapTable.configure({
  resizable: false,
  HTMLAttributes: { class: 'studio-table' },
})
export { TableRow, TableCell, TableHeader }
