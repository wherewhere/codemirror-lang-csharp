const { resolve } = require("path");
const { build } = require("@marijn/buildtool");
const { options } = require("@codemirror/buildhelper/src/options");

const args = process.argv.slice(2);

if (args.length != 1) {
    console.log("Usage: node ./build.cjs src/mainfile.ts");
    process.exit(1);
}

build(resolve(args[0]), { ...options, sourceMap: true }).then(result => {
    if (!result) { process.exit(1); }
});