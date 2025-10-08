const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'ico', 'avif']
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']
const FILE_ICONS = {
  md: 'i-ph-markdown-logo',
  yaml: 'i-fluent-document-yml-20-regular',
  yml: 'i-fluent-document-yml-20-regular',
  json: 'i-lucide-file-json',
  ...IMAGE_EXTENSIONS.reduce((acc, ext) => ({ ...acc, [ext]: 'i-lucide-file-image' }), {}),
  ...VIDEO_EXTENSIONS.reduce((acc, ext) => ({ ...acc, [ext]: 'i-lucide-file-video' }), {}),
  ...AUDIO_EXTENSIONS.reduce((acc, ext) => ({ ...acc, [ext]: 'i-lucide-file-audio' }), {}),
}

export function getFileExtension(path: string) {
  return path.split('#')[0].split('.').pop()!.toLowerCase()
}

export function getFileIcon(path: string) {
  return FILE_ICONS[getFileExtension(path) as keyof typeof FILE_ICONS] || 'i-mdi-file'
}

export function isVideoFile(path: string) {
  return VIDEO_EXTENSIONS.includes(getFileExtension(path))
}

export function isAudioFile(path: string) {
  return AUDIO_EXTENSIONS.includes(getFileExtension(path))
}

export function isImageFile(path: string) {
  return IMAGE_EXTENSIONS.includes(getFileExtension(path))
}
