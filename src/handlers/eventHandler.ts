async function loadListeners(client: any) {
    const ascii = require("ascii-table"),
        fs = require("fs");

    await client.events.clear;

    const table = new ascii().setHeading("Listeners", "Status");

    console.log(`š Loading listeners...`);

    const eventFolders = fs.readdirSync('./src/listeners');
    for (const folder of eventFolders) {
        const eventFiles = fs
            .readdirSync(`./src/listeners/${folder}`)
            .filter((f: string) => f.split(".").pop() === "ts");
        if (eventFiles.length <= 0) {
            console.log("ā No listeners found!");
            return;
        }
        switch (folder) {
            case "client":
                eventFiles.forEach((f: string) => {
                    client.on(f.split(".")[0], require(process.cwd() + `/src/listeners/${folder}/${f}`).bind(null, client));
                    table.addRow(f, "ā");
                });
                break;
            case "mongo":
                eventFiles.forEach((f: string) => {
                    client.on(f.split(".")[0], require(process.cwd() + `/src/listeners/${folder}/${f}`).bind(null, client));
                    table.addRow(f, "ā");
                });
                break;
        }
    }
    return console.log(table.toString(), "\nā Loaded listeners")
};

module.exports = {
    loadListeners: loadListeners
};