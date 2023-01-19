const { glob } = require("glob");
const { promisify } = require("util");
const proGlob = promisify(glob);

async function loadFiles(dirName: any) {
    const Files = await proGlob(`${process.cwd().replace(/\\/g, "/")}/${dirName}/**/*.ts`);
    console.log(Files);
    Files.forEach((file: string) => delete require.cache[require.resolve(file)]);
    return Files;
}

module.exports = { loadFiles }; 