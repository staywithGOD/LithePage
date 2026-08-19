const { spawnSync } = require("node:child_process");
const path = require("node:path");

if (process.argv[2]) {
  process.env.LITHEPAGE_BROWSER_CHANNEL = process.argv[2];
}

const suites = [
  "test-extension.cjs",
  "test-segmentation-regressions.cjs",
  "test-atomic-references-v12.cjs",
  "test-v2-dynamic-release.cjs"
];

let failed = 0;

for (const suite of suites) {
  console.log(`\n=== ${suite} ===`);
  const result = spawnSync(process.execPath, [path.join(__dirname, suite)], {
    cwd: path.resolve(__dirname, ".."),
    env: process.env,
    encoding: "utf8",
    stdio: "inherit"
  });

  if (result.error) {
    console.error(result.error);
    failed += 1;
  } else if (result.status !== 0) {
    failed += 1;
  }
}

if (failed) {
  console.error(`\n${failed} regression suite(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${suites.length} regression suites passed.`);
}
