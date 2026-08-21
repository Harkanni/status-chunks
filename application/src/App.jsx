import { useEffect, useRef, useState, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import JSZip from 'jszip'
import posthog from 'posthog-js'


const CORE_VERSION = '0.12.10'
// const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`

const PRESETS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s · WhatsApp status', value: 90 },
]

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(1)} ${units[i]}`
}

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// The filmstrip: a horizontal strip of perforated segments showing exactly
// where the cuts will land before any processing happens.
function Filmstrip({ duration, chunkSeconds }) {
  if (!duration || !chunkSeconds) return null
  const count = Math.max(1, Math.ceil(duration / chunkSeconds))
  const segments = Array.from({ length: count }, (_, i) => {
    const start = i * chunkSeconds
    const end = Math.min(duration, start + chunkSeconds)
    return { start, end, length: end - start }
  })

  return (
    <div className="filmstrip-wrap">
      <div className="filmstrip">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="frame"
            style={{ flexGrow: seg.length }}
            title={`${formatTime(seg.start)} – ${formatTime(seg.end)}`}
          >
            <div className="sprockets top">
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j} />
              ))}
            </div>
            <div className="frame-label">
              <span className="frame-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="frame-len">{Math.round(seg.length)}s</span>
            </div>
            <div className="sprockets bottom">
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="filmstrip-caption">
        {count} clip{count === 1 ? '' : 's'} · last one is{' '}
        {Math.round(segments[segments.length - 1].length)}s
      </p>
    </div>
  )
}

export default function App() {
  const ffmpegRef = useRef(null)
  const loadPromiseRef = useRef(null) // dedupes concurrent getFFmpeg() calls
  const [coreLoaded, setCoreLoaded] = useState(false)
  const [coreLoading, setCoreLoading] = useState(false)
  const [engineError, setEngineError] = useState(null)

  const [videoFile, setVideoFile] = useState(null)
  const [videoURL, setVideoURL] = useState(null)
  const [duration, setDuration] = useState(null)

  const [chunkSeconds, setChunkSeconds] = useState(90)
  const [mode, setMode] = useState('fast') // 'fast' (stream copy) | 'precise' (re-encode)

  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState(null)
  const [chunks, setChunks] = useState([])
  const [zipping, setZipping] = useState(false)

  const dropRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const getFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current
    if (loadPromiseRef.current) return loadPromiseRef.current

    const load = async () => {
      const ffmpeg = new FFmpeg()
      ffmpeg.on('progress', ({ progress: p }) => {
        if (typeof p === 'number' && !Number.isNaN(p)) {
          setProgress(Math.min(100, Math.max(0, Math.round(p * 100))))
        }
      })
      ffmpeg.on('log', ({ message }) => {
        setStatusMsg(message)
      })

      setCoreLoading(true)
      setEngineError(null)
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
        })
        ffmpegRef.current = ffmpeg
        setCoreLoaded(true)
        return ffmpeg
      } catch (e) {
        setEngineError(e.message || String(e))
        loadPromiseRef.current = null // allow a retry later
        throw e
      } finally {
        setCoreLoading(false)
      }
    }

    loadPromiseRef.current = load()
    return loadPromiseRef.current
  }, [])

  // Start fetching the engine the moment the page mounts, in parallel with
  // whatever the user does next (reading the page, picking a file, etc.)
  // so the "Split" click feels instant by the time they get there.
  useEffect(() => {
    getFFmpeg().catch((e) => {
      console.error(e)
      console.error(e.stack)
    })
  }, [getFFmpeg])

  // Revoke any outstanding blob URLs when the component unmounts.
  useEffect(() => {
    return () => {
      if (videoURL) URL.revokeObjectURL(videoURL)
      chunks.forEach((c) => URL.revokeObjectURL(c.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Register the service worker so the FFmpeg core files are cached
// explicitly (survives clearing browser cache / private windows), on
// top of whatever the CDN's own HTTP cache headers already give us.
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      console.error('SW registration failed:', e)
    })
  }
}, [])

  function resetForNewFile(file) {
    chunks.forEach((c) => URL.revokeObjectURL(c.url))
    if (videoURL) URL.revokeObjectURL(videoURL)
    setChunks([])
    setError(null)
    setProgress(0)
    setStatusMsg('')
    setDuration(null)
    setVideoFile(file)
    setVideoURL(file ? URL.createObjectURL(file) : null)
    if (file) {
      posthog.capture('video_uploaded', {
        file_type: file.type,
        file_size_bytes: file.size,
      })
      // If the mount-time preload failed (e.g. flaky network) or never
      // started, this gives it another shot now that it's actually needed.
      if (!ffmpegRef.current && !loadPromiseRef.current) {
        getFFmpeg().catch((e) => console.error(e))
      }
    }
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0]
    if (file) resetForNewFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('video/')) resetForNewFile(file)
  }

  async function handleSplit() {
    if (!videoFile) return
    setProcessing(true)
    setError(null)
    setProgress(0)
    chunks.forEach((c) => URL.revokeObjectURL(c.url))
    setChunks([])

    posthog.capture('split_started', {
      chunk_seconds: chunkSeconds,
      cut_mode: mode,
      video_duration_seconds: duration,
      file_size_bytes: videoFile.size,
    })

    try {
      const ffmpeg = await getFFmpeg()
      const inputName = 'input' + (videoFile.name.match(/\.\w+$/)?.[0] || '.mp4')
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile))

      const outPattern = 'chunk_%03d.mp4'
      const args =
        mode === 'fast'
          ? [
              '-i', inputName,
              '-map', '0',
              '-c', 'copy',
              '-f', 'segment',
              '-segment_time', String(chunkSeconds),
              '-reset_timestamps', '1',
              outPattern,
            ]
          : [
              '-i', inputName,
              '-map', '0',
              '-c:v', 'libx264',
              '-preset', 'veryfast',
              '-crf', '23',
              '-c:a', 'aac',
              '-b:a', '128k',
              '-f', 'segment',
              '-segment_time', String(chunkSeconds),
              '-reset_timestamps', '1',
              outPattern,
            ]

      await ffmpeg.exec(args)

      const entries = await ffmpeg.listDir('/')
      const chunkFiles = entries
        .filter((e) => !e.isDir && /^chunk_\d+\.mp4$/.test(e.name))
        .sort((a, b) => a.name.localeCompare(b.name))

      if (chunkFiles.length === 0) {
        throw new Error('No output was produced — the video may be in an unsupported format.')
      }

      const results = []
      for (const entry of chunkFiles) {
        const data = await ffmpeg.readFile(entry.name)
        const blob = new Blob([data.buffer], { type: 'video/mp4' })
        results.push({
          name: entry.name.replace('chunk_', `${videoFile.name.replace(/\.\w+$/, '')}_part`),
          url: URL.createObjectURL(blob),
          size: blob.size,
        })
        await ffmpeg.deleteFile(entry.name)
      }
      await ffmpeg.deleteFile(inputName)

      setChunks(results)
      posthog.capture('split_completed', {
        chunk_count: results.length,
        chunk_seconds: chunkSeconds,
        cut_mode: mode,
        video_duration_seconds: duration,
      })
    } catch (e) {
      posthog.captureException(e, { cut_mode: mode, chunk_seconds: chunkSeconds })
      posthog.capture('split_failed', {
        error_message: e.message || String(e),
        cut_mode: mode,
        chunk_seconds: chunkSeconds,
      })
      setError(e.message || String(e))
    } finally {
      setProcessing(false)
      setStatusMsg('')
    }
  }

  async function handleDownloadAll() {
    setZipping(true)
    try {
      const zip = new JSZip()
      for (const c of chunks) {
        const res = await fetch(c.url)
        const buf = await res.arrayBuffer()
        zip.file(c.name, buf)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'status-clips.zip'
      a.click()
      URL.revokeObjectURL(url)
      posthog.capture('all_clips_downloaded', {
        clip_count: chunks.length,
        total_size_bytes: chunks.reduce((sum, c) => sum + c.size, 0),
      })
    } finally {
      setZipping(false)
    }
  }

  const canSplit = videoFile && duration && !processing && !coreLoading

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-mark" aria-hidden="true">
          <div className="reel" />
          <div className="reel" />
        </div>
        <div>
          <h1>Status Splitter</h1>
          <p className="subtitle">
            Drop in a video, set the clip length, get back status-ready chunks.
            Everything is cut right here in your browser — nothing is uploaded anywhere.
          </p>
          {!coreLoaded && (
            <p className="engine-status" role="status">
              {engineError
                ? 'Engine failed to preload — it will retry once you pick a video.'
                : 'Preparing the video engine in the background…'}
            </p>
          )}
        </div>
      </header>

      <section
        ref={dropRef}
        className={`dropzone ${dragActive ? 'active' : ''} ${videoFile ? 'has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {!videoFile ? (
          <>
            <p className="drop-title">Drag a video here</p>
            <p className="drop-sub">or</p>
            <label className="file-btn">
              Choose a file
              <input type="file" accept="video/*" onChange={handleFileInput} hidden />
            </label>
          </>
        ) : (
          <div className="preview-row">
            <video
              src={videoURL}
              controls
              className="preview-video"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
            <div className="preview-meta">
              <p className="file-name">{videoFile.name}</p>
              <p className="file-sub">
                {formatBytes(videoFile.size)} · {duration ? formatTime(duration) : 'reading…'}
              </p>
              <label className="file-btn subtle">
                Choose a different file
                <input type="file" accept="video/*" onChange={handleFileInput} hidden />
              </label>
            </div>
          </div>
        )}
      </section>

      {videoFile && (
        <section className="controls">
          <div className="control-row">
            <label htmlFor="chunkSeconds">Clip length</label>
            <div className="chunk-input">
              <input
                id="chunkSeconds"
                type="number"
                min={5}
                max={600}
                step={5}
                value={chunkSeconds}
                onChange={(e) => setChunkSeconds(Number(e.target.value) || 90)}
              />
              <span>seconds</span>
            </div>
            <div className="presets">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  className={`preset ${chunkSeconds === p.value ? 'selected' : ''}`}
                  onClick={() => {
                    setChunkSeconds(p.value)
                    posthog.capture('clip_length_preset_selected', { preset_seconds: p.value, preset_label: p.label })
                  }}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Filmstrip duration={duration} chunkSeconds={chunkSeconds} />

          <div className="control-row mode-row">
            <label>Cut mode</label>
            <div className="mode-toggle">
              <button
                className={mode === 'fast' ? 'selected' : ''}
                onClick={() => { setMode('fast'); posthog.capture('cut_mode_changed', { cut_mode: 'fast' }) }}
                type="button"
              >
                Fast
                <span>No re-encoding · cuts land on the nearest keyframe</span>
              </button>
              <button
                className={mode === 'precise' ? 'selected' : ''}
                onClick={() => { setMode('precise'); posthog.capture('cut_mode_changed', { cut_mode: 'precise' }) }}
                type="button"
              >
                Precise
                <span>Re-encodes · every clip is exactly the length you set</span>
              </button>
            </div>
          </div>

          <button className="split-btn" onClick={handleSplit} disabled={!canSplit}>
            {processing
              ? `Cutting… ${progress}%`
              : coreLoading
              ? 'Loading engine…'
              : `Split into ${Math.ceil((duration || 0) / chunkSeconds) || ''} clips`}
          </button>

          {processing && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
          {processing && statusMsg && <p className="log-line">{statusMsg}</p>}
          {error && <p className="error">{error}</p>}
        </section>
      )}

      {chunks.length > 0 && (
        <section className="results">
          <div className="results-head">
            <h2>{chunks.length} clips ready</h2>
            <button className="zip-btn" onClick={handleDownloadAll} disabled={zipping}>
              {zipping ? 'Zipping…' : 'Download all (.zip)'}
            </button>
          </div>
          <div className="chunk-grid">
            {chunks.map((c, i) => (
              <div className="chunk-card" key={c.url}>
                <video src={c.url} controls />
                <div className="chunk-meta">
                  <span className="chunk-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="chunk-size">{formatBytes(c.size)}</span>
                </div>
                <a
                  className="download-btn"
                  href={c.url}
                  download={c.name}
                  onClick={() => posthog.capture('clip_downloaded', { clip_index: i + 1, clip_size_bytes: c.size })}
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="footnote">
        <p>
          First split downloads a ~30&nbsp;MB video engine from a CDN (cached after that — do it on
          Wi-Fi). Every split after that runs fully offline.
        </p>
      </footer>
    </div>
  )
}