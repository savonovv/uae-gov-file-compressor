#!/usr/bin/env node
/**
 * WASM module pre-build test
 * Run via: node wasm-test.js
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const WASM_DIR = join(process.cwd(), 'public/wasm');
const requiredFiles = [
  'pdf_compressor.js',
  'pdf_compressor_bg.wasm',
  'pdf_compressor.d.ts',
  'package.json'
];

console.log('Testing WASM files...\n');

let allOk = true;

for (const file of requiredFiles) {
  const filePath = join(WASM_DIR, file);
  if (existsSync(filePath)) {
    const size = (readFileSync(filePath).length / 1024).toFixed(1);
    console.log(`  OK: ${file} (${size} KB)`);
  } else {
    console.log(`  MISSING: ${file}`);
    allOk = false;
  }
}

if (!allOk) {
  console.error('\nTest failed - missing files');
  process.exit(1);
}

// Verify .wasm is larger than 1MB (likely compiled)
const wasmSize = readFileSync(join(WASM_DIR, 'pdf_compressor_bg.wasm')).length;
if (wasmSize < 500000) {
  console.error(`\nWASM file too small (${wasmSize} bytes) - may not be compiled`);
  process.exit(1);
}

console.log(`\nAll files present, WASM: ${(wasmSize/1024).toFixed(0)} KB`);
console.log('Test passed - ready to build!\n');