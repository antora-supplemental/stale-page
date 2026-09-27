'use strict'
const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { scanStalePages } = require('../lib/scan.js')
const { buildReport } = require('../lib/report.js')

describe('stale-page', () => {
  let tmp
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stale-page-'))
    fs.writeFileSync(path.join(tmp, 'fresh.adoc'), '= Fresh\n:page-last-edited: 2026-09-01\n\nOk.\n')
    fs.writeFileSync(path.join(tmp, 'old.adoc'), '= Old\n:page-last-edited: 2020-01-01\n\nStale.\n')
  })
  after(() => fs.rmSync(tmp, { recursive: true, force: true }))
  it('flags pages past threshold', () => {
    const scan = scanStalePages({ root: tmp, days: 30, useGit: false, now: new Date('2026-09-27T00:00:00Z') })
    assert.equal(scan.findings.length, 1)
    assert.equal(scan.findings[0].target, 'old.adoc')
    assert.equal(buildReport(scan).summary.stale, 1)
  })
})
