#!/usr/bin/env node
'use strict'
const path = require('node:path')
const { scanStalePages, buildReport, writeOutputs } = require('../lib/index.js')
const { createProgress } = require('../lib/progress.js')

const TOOL = 'stale-page'

function parseArgs (argv) {
  const opts = { root: '.', out: 'stale-page-report', days: 365, fail: false, useGit: true, reportEmail: 'support@devcentr.org' }
  const args = argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--root') opts.root = args[++i]
    else if (a === '--out') opts.out = args[++i]
    else if (a === '--days') opts.days = Number(args[++i]) || 365
    else if (a === '--no-git') opts.useGit = false
    else if (a === '--fail') opts.fail = true
    else if (a === '--report-email') opts.reportEmail = args[++i]
    else if (a === '--help' || a === '-h') opts.help = true
  }
  return opts
}

function main () {
  const opts = parseArgs(process.argv)
  if (opts.help) {
    console.log('Usage: stale-page [--root DIR] [--days N] [--no-git] [--out DIR] [--fail]\nSupport: support@devcentr.org')
    process.exit(0)
  }
  const progress = createProgress({ id: TOOL, stream: process.stderr })
  progress.starting('starting stale page scan')
  progress.enumStart('files')
  const scan = scanStalePages({
    ...opts,
    onFile (n) { progress.enumTick(n) },
    onWalkDone (n) { progress.enumDone(n) },
    onScan (i, total) { progress.tick(i, total) },
  })
  const report = buildReport(scan, { reportEmail: opts.reportEmail })
  writeOutputs(report, path.resolve(opts.out))
  progress.done(
    'scanned ' + scan.filesScanned + ' file(s); ' + report.summary.findings + ' stale'
  )
  if (opts.fail && report.summary.findings > 0) process.exit(1)
}
main()
