'use strict'
const fs = require('node:fs')
const path = require('node:path')
const { buildGroupings, buildTriageHtml, buildTriageActions, assets } = require('@antora-supplemental/triage-ux-kit')

function buildReport (scan, { reportEmail = 'support@devcentr.org', ciTrigger = null } = {}) {
  const findings = scan.findings || []
  const groupings = buildGroupings(findings)
  const report = {
    version: 1, tool: 'stale-page', generatedAt: new Date().toISOString(),
    summary: { filesScanned: scan.filesScanned, days: scan.days, findings: findings.length, stale: findings.length, groupingDefault: groupings.default },
    findings, groupings, meta: { reportEmail, ciTrigger },
  }
  report.actions = buildTriageActions(report, { ciTrigger, toolName: 'Stale Page' })
  return report
}

function writeOutputs (report, outDir) {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'index.html'), buildTriageHtml({
    title: 'Stale Page', toolName: 'Stale Page',
    reportEmail: report.meta?.reportEmail || 'support@devcentr.org',
    ciTrigger: report.meta?.ciTrigger,
    lede: 'Pages older than ' + report.summary.days + ' day(s).',
  }))
  if (fs.existsSync(assets.cssPath)) fs.copyFileSync(assets.cssPath, path.join(outDir, 'triage-ux.css'))
  if (fs.existsSync(assets.jsPath)) fs.copyFileSync(assets.jsPath, path.join(outDir, 'triage-ux.js'))
}
module.exports = { buildReport, writeOutputs }
