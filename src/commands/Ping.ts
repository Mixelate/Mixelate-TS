import { ChatInputCommandInteraction } from "discord.js";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Replies with Pong!"),
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	execute(interaction: ChatInputCommandInteraction) {
		interaction.reply({
			content: "Pong!",
			ephemeral: true
		});
	}
};