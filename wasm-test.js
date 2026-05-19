#!/usr/bin/env node
/**
 * Тест WASM модуля перед сборкой
 * Запускается через: node wasm-test.js
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

console.log('🧪 Проверка WASM файлов...\n');

let allOk = true;

for (const file of requiredFiles) {
  const filePath = join(WASM_DIR, file);
  if (existsSync(filePath)) {
    const size = (readFileSync(filePath).length / 1024).toFixed(1);
    console.log(`  ✅ ${file} (${size} KB)`);
  } else {
    console.log(`  ❌ ${file} — НЕ НАЙДЕН`);
    allOk = false;
  }
}

if (!allOk) {
  console.error('\n❌ Тест провален — отсутствуют файлы');
  process.exit(1);
}

// Проверяем что .wasm весит больше 1MB (скорее всего скомпилирован)
const wasmSize = readFileSync(join(WASM_DIR, 'pdf_compressor_bg.wasm')).length;
if (wasmSize < 500000) {
  console.error(`\n❌ WASM файл слишком маленький (${wasmSize} bytes) — возможно не скомпилирован`);
  process.exit(1);
}

console.log(`\n✅ Все файлы на месте, WASM: ${(wasmSize/1024).toFixed(0)} KB`);
console.log('✅ Тест пройден — можно собирать!\n');