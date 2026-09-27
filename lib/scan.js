'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const LAST_EDITED_RE = /^:page-last-edited:\s*(.+)$/m

function walkAdoc (root, files = [], onFile) {
  if (!fs.existsSync(root)) return files
  const st = fs.statSync(root)
  if (st.isFile()) {
    if (root.endsWith('.adoc')) {
      files.push(root)
      if (typeof onFile === 'function') onFile(files.length, root)
    }
    return files
  }
  for (const name of fs.readdirSync(root)) {
    if (name === 'node_modules' || name === '.git' || name === 'build') continue
    walkAdoc(path.join(root, name), files, onFile)
  }
  return files
}

function parseDate (raw) {
  if (!raw) return null
  const d = new Date(String(raw).trim())
  if (Number.isNaN(d.getTime())) return null
  return d
}

function gitLastModified (file, cwd) {
  try {
    const out = execSync('git log -1 --format=%cI -- ' + JSON.stringify(file), {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return parseDate(out)
  } catch (_) {
    return null
  }
}

function scanStalePages (opts = {}) {
  const root = path.resolve(opts.root || '.')
  const days = opts.days != null ? Number(opts.days) : 365
  const useGit = opts.useGit !== false
  const now = opts.now || new Date()
  const thresholdMs = days * 24 * 60 * 60 * 1000
  const onFile = opts.onFile
  const files = walkAdoc(root, [], onFile)
  if (typeof opts.onWalkDone === 'function') opts.onWalkDone(files.length)
  const findings = []
  const onScan = opts.onScan

  let idx = 0
  for (const file of files) {
    idx += 1
    if (typeof onScan === 'function') onScan(idx, files.length, file)
    const text = fs.readFileSync(file, 'utf8')
    const m = text.match(LAST_EDITED_RE)
    let edited = m ? parseDate(m[1]) : null
    let source = 'page-last-edited'
    if (!edited && useGit) {
      edited = gitLastModified(file, root)
      source = 'git'
    }
    if (!edited && useGit) {
      edited = new Date(fs.statSync(file).mtimeMs)
      source = 'mtime'
    }
    if (!edited) continue
    const ageMs = now.getTime() - edited.getTime()
    if (ageMs > thresholdMs) {
      const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000))
      findings.push({
        target: path.relative(root, file).split(path.sep).join('/'),
        classification: 'stale',
        kind: 'stale-page',
        sources: [path.relative(root, file).split(path.sep).join('/')],
        lastEdited: edited.toISOString().slice(0, 10),
        ageDays,
        dateSource: source,
      })
    }
  }
  findings.sort((a, b) => b.ageDays - a.ageDays)
  return { root, days, filesScanned: files.length, findings }
}

module.exports = { scanStalePages, parseDate }
