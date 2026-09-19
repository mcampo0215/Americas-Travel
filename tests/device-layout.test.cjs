const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/device-layout.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject });
const { getDeviceLayout } = exportsObject;

test('iPhones retain compact controls in portrait and landscape', () => {
  for (const [width, height] of [[320, 568], [375, 667], [393, 852], [440, 956]]) {
    assert.equal(getDeviceLayout(width, height).isTablet, false);
    assert.equal(getDeviceLayout(height, width).isTablet, false);
    assert.equal(getDeviceLayout(height, width).useColumns, false);
  }
});

test('iPad windows respond to rotation, split view, and larger text', () => {
  assert.equal(getDeviceLayout(744, 1133).isTablet, true);
  assert.equal(getDeviceLayout(744, 1133).useColumns, false);
  assert.equal(getDeviceLayout(820, 1180).isTablet, true);
  assert.equal(getDeviceLayout(820, 1180).useColumns, false);
  assert.equal(getDeviceLayout(1180, 820).useColumns, true);
  assert.equal(getDeviceLayout(507, 1000).isTablet, false);
  assert.equal(getDeviceLayout(1024, 500).useColumns, false);
  assert.equal(getDeviceLayout(1180, 820, 2).useColumns, false);
});
