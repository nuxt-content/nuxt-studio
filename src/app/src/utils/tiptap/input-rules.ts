import { InputRule, callOrReturn } from '@tiptap/core'
import type { ExtendedRegExpMatchArray, nodeInputRule } from '@tiptap/core'

type Config = Parameters<typeof nodeInputRule>[0] & { getText?: (match: ExtendedRegExpMatchArray) => string }

export function textInputRule(config: Config) {
  return new InputRule({
    find: config.find,
    handler: ({ state, range, match }) => {
      if (!match[1]) {
        return
      }

      const attributes = callOrReturn(config.getAttributes, undefined, match) || {}
      const text = callOrReturn(config.getText, undefined, match) || ''
      const { tr } = state
      const start = range.from
      let end = range.to

      const newNode = config.type.create(attributes)

      const offset = match[0].lastIndexOf(match[1])
      let matchStart = start + offset

      if (matchStart > end) {
        matchStart = end
      }
      else {
        end = matchStart + match[1].length
      }

      // insert last typed character
      const lastChar = match[0][match[0].length - 1]

      tr.insertText(lastChar, start + match[0].length - 1)

      // insert node from input rule
      tr.replaceWith(matchStart, end, newNode)
      tr.insertText(text, matchStart + 1)

      tr.scrollIntoView()
    },
  })
}
