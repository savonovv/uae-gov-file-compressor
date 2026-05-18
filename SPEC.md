# UAE Government File Compressor

## Concept & Vision

A privacy-first, client-side file compression tool designed for UAE government services (Moccae, etc.). Users upload their files and receive compressed versions — all processing happens entirely in their browser. No data ever leaves the device. Clean, professional, trustworthy aesthetic that communicates security and government-grade reliability.

## Design Language

**Aesthetic:** Professional government service — clean, authoritative, trustworthy. Inspired by UAE government digital services (moccae.gov.ae aesthetic). Subtle Arabic design touches without being heavy-handed.

**Color Palette:**
- Primary: `#0066B3` (UAE Government Blue)
- Secondary: `#003D6B` (Dark Blue)
- Accent: `#00A651` (Success Green)
- Background: `#F5F7FA` (Light Gray)
- Surface: `#FFFFFF` (White cards)
- Text Primary: `#1A1A2E`
- Text Secondary: `#6B7280`
- Error: `#DC2626`
- Warning: `#F59E0B`

**Typography:**
- Headings: `IBM Plex Sans Arabic` (600/700 weight) with fallback to `Inter`
- Body: `Inter` (400/500)
- Monospace (file names, sizes): `JetBrains Mono`

**Spatial System:**
- Base unit: 8px
- Card padding: 24px
- Section spacing: 48px
- Border radius: 12px (cards), 8px (buttons), 4px (inputs)

**Motion Philosophy:**
- Functional, not decorative — animations communicate state changes
- Upload progress: smooth linear fill
- File cards: subtle scale on hover (1.02)
- Success states: gentle checkmark animation
- Compression iterations: pulse effect to show active processing

**Visual Assets:**
- Lucide icons (consistent stroke weight)
- UAE flag colors subtly in accents (green/white/black/red)
- Shield icon for privacy messaging
- File type icons for PDF

## Layout & Structure

**Single Page Application:**

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo + Title + Language toggle (EN/AR)             │
├─────────────────────────────────────────────────────────────┤
│  Privacy Banner (always visible, reassuring)                 │
│  🛡️ "All processing happens locally in your browser.        │
│      Your files never leave your device."                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │         Drop Zone                                   │    │
│  │         Drag & drop files here                      │    │
│  │         or click to browse                          │    │
│  │                                                     │    │
│  │         [PDF icon] Supports PDF files                │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Files List (appears after upload):                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📄 document.pdf          45.2 MB → 2.8 MB   94% ▼  │    │
│  │    ████████████████████░░░░░░░░  Compressing...     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Target Size: [3 MB ▾]  │  Quality: [Auto ▾]                │
│                                                             │
│  [Compress Files]  (primary button)                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  How it works: 3 steps with icons                           │
│  1. Upload → 2. Compress locally → 3. Download              │
├─────────────────────────────────────────────────────────────┤
│  Footer: Privacy statement + GitHub link                    │
└─────────────────────────────────────────────────────────────┘
```

**Responsive Strategy:**
- Desktop: centered content max-width 800px
- Mobile: full-width with 16px padding
- Drop zone scales appropriately

## Features & Interactions

### File Upload
- Drag & drop multiple PDF files
- Click to browse (file picker)
- Validate: PDF only, show error for other formats
- Show file name, original size
- Remove file button (X)

### Compression Settings
- Target size: 3MB (default), adjustable: 1MB, 2MB, 3MB, 5MB
- Quality mode: Auto (default), High, Medium, Low
- Auto: iteratively reduces until target met

### Compression Process
- Show progress bar per file
- Show iteration count: "Iteration 3/8..."
- Show实时 size reduction
- Cancel button available during compression
- On complete: green success state, download button appears

### Output
- Single file input → single compressed file output
- Multiple files → ZIP archive containing all compressed files
- Auto-download when complete

### Error Handling
- File too small (< target): notify "already compressed"
- File corrupted/invalid PDF: show error, don't crash
- Browser doesn't support required APIs: show compatibility warning

## Component Inventory

### PrivacyBanner
- Shield icon + text
- Subtle green tint background
- Sticky at top
- States: default only

### DropZone
- Dashed border, rounded corners
- States: default, hover (border becomes solid), drag-over (scale up slightly, highlight), disabled (during processing)

### FileCard
- File icon, name, original size, target size, progress
- States: uploading, queued, compressing (animated progress), complete (green check), error (red X)

### ProgressBar
- Linear fill with percentage
- Animated stripes while active
- States: indeterminate (waiting), determinate (compressing), complete (solid green), error (red)

### SettingsPanel
- Dropdown selects for target size and quality
- Clean, compact horizontal layout

### PrimaryButton
- Full-width on mobile, fixed width on desktop
- States: default, hover (darken), active (press effect), disabled (grayed), loading (spinner)

### ResultCard
- Shows compressed file with size reduction percentage
- Download button (prominent)
- States: ready, downloading

### HowItWorks
- 3 numbered steps with icons
- Horizontal on desktop, vertical on mobile

## Technical Approach

### Stack
- React 18 + Vite
- pdf-lib (PDF manipulation)
- JSZip (for multi-file output)
- Canvas API (image resizing for compression)
- No backend — 100% client-side

### PDF Compression Strategy
1. Parse PDF with pdf-lib
2. Extract all images
3. For each image:
   - Draw to canvas at reduced resolution
   - Re-encode as JPEG at lower quality (starts at 80%, reduces per iteration)
4. Replace original images with compressed versions
5. Flatten annotations if present
6. Strip metadata
7. Check file size — if > target, repeat with lower quality

### Compression Iterations
- Start quality: 80%
- Reduce by: 10% each iteration
- Min quality: 20%
- If still over target at 20%: fail with message (some PDFs can't be compressed to target)

### File Handling
- Files stored in browser memory (ArrayBuffer)
- Use Web Workers for heavy processing to keep UI responsive
- Cleanup on page unload

### Output Generation
- Single file: just compressed PDF
- Multiple files: generate ZIP using JSZip

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires: FileReader, Canvas, Blob, Web Workers
- Show warning if APIs unavailable

## Privacy Messaging

All messaging throughout the app emphasizes local-only processing:

**Header:** "Your files never leave your device"

**Privacy Banner:** "🛡️ All processing happens locally in your browser. Your files are compressed on YOUR computer — nothing is uploaded to any server."

**README.md:** Detailed privacy section explaining:
- No network requests for file processing
- No analytics on uploaded files
- All compression uses browser's native APIs
- Source code available for audit
- Can be self-hosted if desired

## GitHub Pages Deployment

- Static React build
- `gh-pages` branch or GitHub Actions
- Custom domain: `compressor.moccae.ae` (future) or default `*.github.io`
- `_redirects` for SPA routing if needed