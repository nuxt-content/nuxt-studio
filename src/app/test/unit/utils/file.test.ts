import { describe, it, expect } from 'vitest'
import { slugifyFileName } from '../../../src/utils/file'

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
