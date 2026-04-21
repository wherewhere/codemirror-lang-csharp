const { watch } = require("fs");
const { readdir, stat } = require("fs/promises");
const { dirname, resolve } = require("path");
const { build } = require("@marijn/buildtool");
const { options } = require("@codemirror/buildhelper/src/options");

const args = process.argv.slice(2);

if (args.length != 1) {
  console.log("Usage: node ./dev/watch.cjs src/mainfile.ts");
  process.exit(1);
}

/**
 * @param {string} dir
 */
async function collectWatchFilesAsync(dir) {
  const entries = await readdir(dir);
  /** @type {string[]} */
  let files = []
  for (const entry of entries) {
    const full = resolve(dir, entry);
    const file = await stat(full);
    if (file.isDirectory()) {
      files = files.concat(await collectWatchFilesAsync(full));
    }
    else if ((entry.endsWith(".ts") && !entry.endsWith(".d.ts")) || entry.endsWith(".grammar")) {
      files.push(full);
    }
  }
  return files;
}

const main = resolve(args[0]);
const srcDir = resolve(dirname(main));

let building = false, queued = false;
/** @type {NodeJS.Timeout | null} */;
let timer = null;

async function runBuild() {
  if (building) {
    queued = true;
    return;
  }

  console.log(`Rebuilding ${main}`);
  building = true;
  try {
    await build(main, { ...options, sourceMap: true });
    console.log("Rebuilding done.");
  }
  catch (e) {
    console.log("Rebuilding failed.");
    console.error(e);
  }
  finally {
    building = false;
    if (queued) {
      queued = false;
      runBuild();
    }
  }
}

function scheduleBuild() {
  if (timer) { clearTimeout(timer); }
  timer = setTimeout(runBuild, 120);
}

collectWatchFilesAsync(srcDir).then(files => {
  const watchDirs = new Set(files.map(file => dirname(file)));
  for (const dir of watchDirs) {
    watch(dir, scheduleBuild);
  }
});