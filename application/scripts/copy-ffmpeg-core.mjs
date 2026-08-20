import { cpSync, mkdirSync } from 'node:fs'

mkdirSync('public/ffmpeg', { recursive: true })
cpSync('node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js', 'public/ffmpeg/ffmpeg-core.js')
cpSync('node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm', 'public/ffmpeg/ffmpeg-core.wasm')