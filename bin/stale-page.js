#!/usr/bin/env node
'use strict'
const path = require('node:path')
const { scanStalePages, buildReport, writeOutputs } = require('../lib/index.js')
function parseArgs (argv) {
  const opts = { root: '.', out: 'stale-page-report', days: 365, fail: false, useGit: true, reportEmail: 'support@devcentr.org' }
  const args = argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--root') opts.root = args[++i]
    else if (a === '--out') opts.out = args[++i]
    else if (a === '--days') opts.days = Number(args[++i])
    else if (a === '--fail') opts.fail = true
    else if (a === '--no-git') opts.useGit = false
    else if (a === '--report-email') opts.reportEmail = args[++i]
    else if (a === '--help' || a === '-h') opts.help = true
  }
  return opts
}
function main () {
  const opts = parseArgs(process.argv)
  if (opts.help) { console.log('Usage: stale-page [--root DIR] [--days N] [--out DIR] [--fail] [--no-git]\nSupport: support@devcentr.org'); process.exit(0) }
  const scan = scanStalePages(opts)
  const report = buildReport(scan, { reportEmail: opts.reportEmail })
  writeOutputs(report, path.resolve(opts.out))
  console.log('stale-page: ' + report.summary.stale + ' stale page(s) (threshold=' + opts.days + 'd)')
  if (opts.fail && report.summary.stale > 0) process.exit(1)
}
main()
