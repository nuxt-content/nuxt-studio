/**
 * AI utilities - Re-exports for backward compatibility
 */

// Re-export types
export { ContentType } from '../../types/ai'
export type { ContentSample, CollectionMetadata, CollectionArchitecture } from '../../types/ai'

// Re-export generate utilities
export {
  buildLocationContext,
  buildMetadataContext,
  buildHintContext,
  buildCollectionSummaryContext,
  buildAIContext,
  calculateMaxTokens,
  getSystem,
  getFixSystem,
  getImproveSystem,
  getSimplifySystem,
  getTranslateSystem,
  getContinueSystem,
} from './generate'

// Re-export analyze utilities
export {
  detectContentType,
  buildFileTree,
  analyzeArchitecture,
  buildProjectInfoContext,
  buildAnalysisPrompt,
  getAnalyzeSystem,
} from './analyze'
