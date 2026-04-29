// Schema
export {
  applyCollectionSchema,
  pickReservedKeysFromDocument,
  cleanDataKeys,
  reservedKeys,
} from './schema'

// Compare
export {
  isDocumentMatchingContent,
  areDocumentsEqual,
} from './compare'

// Generate
export {
  documentFromContent,
  documentFromMarkdownContent,
  documentFromYAMLContent,
  documentFromJSONContent,
  contentFromDocument,
  contentFromMarkdownDocument,
  contentFromYAMLDocument,
  contentFromJSONDocument,
  isComarkTree,
} from './generate'

// Legacy compatibility — delete this section when @nuxt/content natively returns ComarkTree bodies
export {
  comarkTreeFromLegacyDocument,
  markdownRootFromComarkTree,
} from './legacy'

// Utils
export {
  addPageTypeFields,
  parseDocumentId,
  generatePathFromStem,
  generateStemFromId,
  generateTitleFromPath,
  getFileExtension,
} from './utils'

// Tree (AST manipulation)
export {
  sanitizeDocumentTree,
  removeLastStylesFromTree,
} from './tree'
