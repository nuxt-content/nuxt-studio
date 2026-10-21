import { describe, it, expect } from 'vitest'
import { getAvailableFileName, slugifyFileName } from '../../../src/utils/file'

describe('slugifyFileName', () => {
  it('should slugify filename with spaces', () => {
    const result = slugifyFileName('My Image.png')
    expect(result).toBe('My-Image.png')
  })

  it('should slugify filename with special characters', () => {
    const result = slugifyFileName('Beautiful_Photo@2024.jpg')
    expect(result).toBe('Beautiful-Photo-2024.jpg')
  })

  it('should preserve file extension', () => {
    const result = slugifyFileName('Document File (Final).pdf')
    expect(result).toBe('Document-File-Final.pdf')
  })

  it('should handle filename with multiple dots', () => {
    const result = slugifyFileName('my.backup.image.png')
    expect(result).toBe('my.backup.image.png')
  })

  it('should handle filename with uppercase letters', () => {
    const result = slugifyFileName('MyAwesomeFile.TXT')
    expect(result).toBe('MyAwesomeFile.TXT')
  })

  it('should handle filename without extension', () => {
    const result = slugifyFileName('my-file-name')
    expect(result).toBe('my-file-name')
  })

  it('should handle accented characters', () => {
    const result = slugifyFileName('Café_Münchën.mp4')
    expect(result).toBe('Cafe-Munchen.mp4')
  })

  it('should handle filenames with unicode characters', () => {
    const result = slugifyFileName('日本語ファイル名.txt')
    expect(result).toBe('日本語ファイル名.txt')
  })
})

describe('getAvailableFileName', () => {
  it('should keep the file name when it is free', () => {
    expect(getAvailableFileName('guide.md', ['intro.md'])).toBe('guide.md')
  })

  it('should add a copy suffix before the extension when the name is taken', () => {
    expect(getAvailableFileName('guide.md', ['guide.md'])).toBe('guide-copy.md')
  })

  it('should number the copy suffix until a free name is found', () => {
    expect(getAvailableFileName('guide.md', ['guide.md', 'guide-copy.md', 'guide-copy-2.md'])).toBe('guide-copy-3.md')
  })

  it('should handle names without extension', () => {
    expect(getAvailableFileName('guide', ['guide'])).toBe('guide-copy')
  })
})
