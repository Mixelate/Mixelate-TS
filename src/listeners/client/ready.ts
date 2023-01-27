import { Client } from "discord.js";
const config = require('../../config/config.json'),
    { loadCommands } = require('../../handlers/commandHandler'),
    { mongoose } = require('mongoose');

module.exports = (client: Client) => {
    if (!client.user || !client.application) return;
    
    console.log("=================================");
    console.log(`    Logged in as ${client.user.tag}!`);
    console.log("    Developed by Pateres#3767");
    console.log(`    Do not redistribute!`);
    console.log("=================================");
    client.user.setActivity(config.activity.message || "Mixelate", { type: config.activity.type || 3});

    loadCommands(client);

    mongoose.set('strictQuery', true);
    mongoose.connect(config.databaseURL).then(async () => {
            console.log("✅ Connected to DB");
        }).catch(() => {
            console.log("❌ Connected to DB");
        });
}

