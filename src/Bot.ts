const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js"),
	{ Guilds, GuildMembers, GuildMessages, GuildMessageReactions } = GatewayIntentBits,
	{ User, Message, GuildMember, ThreadMember } = Partials

const client = new Client({
	intents: [Guilds, GuildMembers, GuildMessages, GuildMessageReactions],
	partials: [User, Message, GuildMember, ThreadMember]
});
client.config = require("./config/config.json");

const { GiveawaysManager } = require("discord-giveaways");
client.giveawaysManager = new GiveawaysManager(client, {
	storage: './giveaways.json',
	updateCountdownEvery: 5000,
	default: {
		botsCanWin: false,
		exemptPermissions: ["MANAGE_MESSAGES", "ADMINISTRATOR"],
		embedColor: client.config.embedColor,
		embedColorEnd: client.config.embedColor,
		reaction: '🎉'
	}
});

const { loadListeners } = require("./handlers/eventHandler");

client.commands = new Collection();
client.events = new Collection();
loadListeners(client);

console.log("🔃 Application is launching...");

client.login(client.config.token);

export { };