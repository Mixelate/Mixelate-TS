async function loadCommands(client: any) {
    const ascii = require("ascii-table"),
        path = require("path"),
        fs = require("fs");

    await client.commands.clear;
    
    let commandsArray: any[] = [];
    
    fs.readdir(path.join(__dirname, "../commands"), (err: any, files: any[]) => {

        if (err) console.log(err);
        console.log(`🔃 Loading commands...`);

        let commandFiles = files.filter((f: string) => f.split(".").pop() === "ts");
        if (commandFiles.length <= 0) {
            console.log("❌ No commands found!");
            return;
        }

        const table = new ascii().setHeading("Commands", "Status");
        commandFiles.forEach((f: string) => {
            let command = require(process.cwd() + `/src/commands/${f}`);
            client.commands.set(command.data.name, command);

            commandsArray.push(command.data.toJSON());
            table.addRow(f, "✅");
        });
        client.application.commands.set(commandsArray);

        return console.log(table.toString(), "\n✅ Loaded commands")
    });
}

module.exports = {
    loadCommands: loadCommands
};