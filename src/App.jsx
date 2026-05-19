import { useState, useRef, useCallback } from 'react'
import { Shield, Upload, FileText, X, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react'

const TARGET_SIZES = [
  { label: '1 MB', value: 1 * 1024 * 1024 },
  { label: '2 MB', value: 2 * 1024 * 1024 },
  { label: '3 MB', value: 3 * 1024 * 1024 },
  { label: '5 MB', value: 5 * 1024 * 1024 },
]

const QUALITY_MODES = [
  { label: 'Auto', value: 'auto' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

async function compressPdf(fileBuffer, targetSize, onProgress) {
  // Load our custom Rust WASM compressor (relative path for GitHub Pages subdirectory)
  const wasmModule = await import('./wasm/pdf_compressor.js')
  
  // Initialize WASM before using any functions
  await wasmModule.default()
  
  // If original is already under target, no compression needed
  if (fileBuffer.length <= targetSize) {
    return { buffer: fileBuffer, iterations: 0, success: true }
  }
  
  let iteration = 0
  const maxIterations = 10
  let bestBuffer = null
  let bestSize = fileBuffer.length
  let quality = 85

  while (iteration < maxIterations && quality >= 20) {
    iteration++

    onProgress({
      iteration,
      currentSize: bestSize,
      quality: quality / 100,
      message: `Compressing (quality ${quality}%)...`
    })

    // Call our Rust WASM function to recompress JPEG streams
    let compressedBytes;
    try {
      compressedBytes = wasmModule.compress_jpeg_in_pdf(new Uint8Array(fileBuffer), quality)
    } catch (e) {
      console.error('WASM compression error:', e)
      break
    }

    if (!compressedBytes || compressedBytes.length === 0) {
      console.error('WASM returned empty result')
      break
    }

    const currentSize = compressedBytes.length

    if (currentSize <= targetSize) {
      return { buffer: compressedBytes, iterations: iteration, success: true }
    }

    if (currentSize < bestSize) {
      bestBuffer = compressedBytes
      bestSize = currentSize
    }

    // Reduce quality and try again
    quality -= 10
  }

  // If bestBuffer is null, the original has no compressible content or failed
  if (!bestBuffer) {
    return {
      buffer: fileBuffer,
      iterations: 0,
      success: false,
      warning: 'No JPEG streams found or compression not possible'
    }
  }

  // Return best result with warning if couldn't reach target
  const finalSize = bestSize
  return {
    buffer: bestBuffer,
    iterations: iteration,
    success: finalSize <= targetSize,
    warning: finalSize <= targetSize ? undefined : `Reached ${formatBytes(finalSize)}, target ${formatBytes(targetSize)}`
  }
}

function FileCard({ file, onRemove }) {
  const statusIcon = {
    pending: <Upload className="w-5 h-5 text-gray-400" />,
    compressing: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
    done: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
  }

  const progressPercent = file.progress || 0

  return (
    <div className="file-card">
      <div className="file-icon">{statusIcon[file.status]}</div>
      <div className="file-info">
        <div className="file-name">{file.name}</div>
        <div className="file-meta">
          {file.status === 'pending' && (
            <span>{formatBytes(file.originalSize)}</span>
          )}
          {file.status === 'compressing' && (
            <span className="compressing-text">{file.message}</span>
          )}
          {file.status === 'done' && (
            <span className="done-text">
              {formatBytes(file.originalSize)} → {formatBytes(file.compressedSize)} ({file.reduction}%)
            </span>
          )}
          {file.status === 'error' && (
            <span className="error-text">{file.error}</span>
          )}
        </div>
        {(file.status === 'compressing') && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        )}
      </div>
      {file.status === 'pending' && (
        <button className="remove-btn" onClick={() => onRemove(file.id)}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function DropZone({ onFilesSelected, disabled }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }, [onFilesSelected, disabled])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleClick = () => {
    if (!disabled) inputRef.current.click()
  }

  return (
    <div
      className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files)
          if (files.length > 0) onFilesSelected(files)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />
      <Upload className="drop-icon" />
      <div className="drop-text">Drag & drop PDF files here</div>
      <div className="drop-text-sub">or click to browse</div>
      <div className="drop-hint">
        <FileText className="w-4 h-4" />
        <span>Supports PDF files only</span>
      </div>
    </div>
  )
}

export default function App() {
  const [files, setFiles] = useState([])
  const [targetSize, setTargetSize] = useState(TARGET_SIZES[2])
  const [quality, setQuality] = useState(QUALITY_MODES[0])
  const [isCompressing, setIsCompressing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleFilesSelected = (newFiles) => {
    const fileObjects = newFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      originalSize: file.size,
      file,
      status: 'pending',
      progress: 0,
      compressedBuffer: null,
    }))
    setFiles(prev => [...prev, ...fileObjects])
    setIsComplete(false)
  }

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleCompress = async () => {
    setIsCompressing(true)
    setIsComplete(false)

    const compressedFiles = []

    for (const fileObj of files) {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { ...f, status: 'compressing', message: 'Starting...', progress: 0 }
          : f
      ))

      try {
        const buffer = await fileObj.file.arrayBuffer()
        
        let target = targetSize.value
        // If quality is not auto, adjust target based on quality mode
        if (quality.value === 'high') target = targetSize.value * 0.8
        else if (quality.value === 'medium') target = targetSize.value * 1.2
        else if (quality.value === 'low') target = targetSize.value * 1.5

        const result = await compressPdf(buffer, target, (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, message: progress.message, progress: Math.min(95, (progress.iteration / 10) * 100) }
              : f
          ))
        })

        const reduction = Math.round((1 - result.buffer.length / fileObj.originalSize) * 100)

        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { 
                ...f, 
                status: result.success ? 'done' : 'error', 
                progress: 100,
                compressedBuffer: result.buffer,
                compressedSize: result.buffer.length,
                reduction: Math.max(0, reduction),
                error: result.warning
              }
            : f
        ))

        compressedFiles.push({
          name: fileObj.name,
          buffer: result.buffer
        })
      } catch (err) {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'error', progress: 0, error: err.message }
            : f
        ))
      }
    }

    setIsCompressing(false)

    // Generate output
    if (compressedFiles.length > 0) {
      if (compressedFiles.length === 1) {
        // Single file - direct download
        const blob = new Blob([compressedFiles[0].buffer], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = compressedFiles[0].name
        a.click()
        URL.revokeObjectURL(url)
      } else {
        // Multiple files - ZIP
        const { default: JSZip } = await import('jszip')
        const zip = new JSZip()
        
        for (const cf of compressedFiles) {
          zip.file(cf.name, cf.buffer)
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'compressed_files.zip'
        a.click()
        URL.revokeObjectURL(url)
      }
      setIsComplete(true)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#0066B3"/>
              <path d="M20 8L28 14V26L20 32L12 26V14L20 8Z" fill="#00A651"/>
              <path d="M20 14L24 17V23L20 26L16 23V17L20 14Z" fill="white"/>
            </svg>
            <div>
              <h1>UAE Government File Compressor</h1>
              <p className="subtitle">Privacy-first compression tool</p>
            </div>
          </div>
        </div>
      </header>

      <div className="privacy-banner">
        <Shield className="w-5 h-5" />
        <span>All processing happens locally in your browser. Your files never leave your device.</span>
      </div>

      <main className="main">
        <DropZone 
          onFilesSelected={handleFilesSelected} 
          disabled={isCompressing}
        />

        {files.length > 0 && (
          <div className="files-list">
            {files.map(file => (
              <FileCard 
                key={file.id} 
                file={file} 
                onRemove={removeFile}
              />
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="settings-panel">
            <div className="setting">
              <label>Target Size</label>
              <select 
                value={targetSize.value} 
                onChange={(e) => setTargetSize(TARGET_SIZES.find(s => s.value === Number(e.target.value)))}
              >
                {TARGET_SIZES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="setting">
              <label>Quality</label>
              <select 
                value={quality.value} 
                onChange={(e) => setQuality(QUALITY_MODES.find(q => q.value === e.target.value))}
              >
                {QUALITY_MODES.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <button 
            className={`compress-btn ${isCompressing ? 'loading' : ''}`}
            onClick={handleCompress}
            disabled={isCompressing || files.length === 0}
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Compressing...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Compress {files.length} file{files.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        )}

        {isComplete && (
          <div className="success-message">
            <CheckCircle className="w-6 h-6" />
            <span>Compression complete! Your files have been downloaded.</span>
          </div>
        )}

        <div className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon"><Upload className="w-6 h-6" /></div>
              <div className="step-text">Upload your PDF files</div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon"><FileText className="w-6 h-6" /></div>
              <div className="step-text">Compress locally in browser</div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon"><Download className="w-6 h-6" /></div>
              <div className="step-text">Download compressed files</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>100% client-side processing. No files are uploaded to any server.</p>
        <p className="github-link">
          <a href="https://github.com/savonovv/uae-gov-file-compressor" target="_blank" rel="noopener noreferrer">
            View source on GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}