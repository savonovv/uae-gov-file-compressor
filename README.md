# UAE Government File Compressor

A privacy-first, client-side PDF compression tool designed for UAE government services (Moccae, etc.).

**Your files never leave your device. All processing happens in your browser.**

## 🔒 Privacy Guarantee

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   ⚠️  IMPORTANT: YOUR FILES NEVER LEAVE YOUR DEVICE         │
│                                                              │
│   This tool processes files 100% locally in your browser.    │
│   No data is uploaded to any server. No tracking. No logging. │
│                                                              │
│   • Zero network requests for file processing                │
│   • No analytics on uploaded files                            │
│   • Open source — you can audit the code                     │
│   • Works offline after first load                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### How is this possible?

Modern browsers have all the tools needed to process PDF files locally:
- **pdf-lib**: Parse and modify PDF structure entirely in JavaScript
- **Canvas API**: Compress images embedded in PDFs
- **File API**: Read and write files without server involvement

## 📋 Features

- **Compress PDF files** to target size (1MB, 2MB, 3MB, or 5MB)
- **Batch processing**: Upload multiple files at once
- **Automatic iteration**: Reduces quality iteratively until target is met
- **ZIP output**: Multiple files are packaged into a single ZIP archive
- **100% client-side**: Nothing leaves your browser

## 🚀 Quick Start

### Use online (recommended)

Visit the live version at: **[https://yourusername.github.io/uae-gov-file-compressor](https://yourusername.github.io/uae-gov-file-compressor)**

### Run locally

```bash
# Clone the repository
git clone https://github.com/yourusername/uae-gov-file-compressor.git
cd uae-gov-file-compressor

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to GitHub Pages or any static hosting.

## 📖 How It Works

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  Upload  │ →   │   Compress    │ →   │   Download   │
│  Files   │     │  (in browser) │     │   Results    │
└──────────┘     └───────────────┘     └──────────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │  PDF processing:    │
           │  • Strip metadata   │
           │  • Compress images  │
           │  • Reduce quality   │
           │    iteratively      │
           └─────────────────────┘
```

### Compression Algorithm

1. **Parse PDF** using pdf-lib
2. **Strip metadata** (title, author, keywords, etc.)
3. **Compress images** by reducing JPEG quality (starts at 85%)
4. **Optimize structure** with object streams
5. **Check size** — if over target, repeat with lower quality
6. **Output**: Single PDF or ZIP with multiple files

## 🛠️ Technical Stack

- **React 18** — UI framework
- **Vite** — Build tool
- **pdf-lib** — PDF parsing and manipulation
- **JSZip** — ZIP file generation
- **Lucide React** — Icons

## 📁 Project Structure

```
uae-gov-file-compressor/
├── index.html          # Entry point
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.jsx       # React entry
│   ├── App.jsx        # Main application component
│   └── styles.css     # All styles
├── SPEC.md             # Design specification
└── README.md           # This file
```

## 🌐 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 80+ | ✅ Full |
| Firefox 75+ | ✅ Full |
| Safari 13+ | ✅ Full |
| Edge 80+ | ✅ Full |

Requires: FileReader API, Canvas API, Blob API, Web Workers

## 🤝 Contributing

Contributions are welcome! Please read the specification in `SPEC.md` before making changes.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Made with ❤️ in the UAE for UAE government services**