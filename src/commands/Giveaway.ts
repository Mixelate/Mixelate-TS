import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
const ms = require("ms"),
    client = require("../Bot");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Default description")
        .addSubcommand(option =>
            option.setName("start")
                .setDescription("Start a giveaway")
                .addStringOption(option =>
                    option.setName("duration")
                        .setDescription("How long would you like this giveaway to last?")
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName("winners")
                        .setDescription("How many users would you like to win?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("prize")
                        .setDescription("What is the prize of this giveaway?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("reroll")
                .setDescription("Reroll a giveaway's winner")
                .addStringOption(option =>
                    option.setName("id")
                        .setDescription("What is the giveaway's messageID?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("end")
                .setDescription("End a giveaway")
                .addStringOption(option =>
                    option.setName("id")
                        .setDescription("What is the giveaway's messageID?")
                        .setRequired(true))),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction: ChatInputCommandInteraction) {
        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case "start": {
                const duration = interaction.options.getString("duration");
                const winners = interaction.options.getInteger("winners");
                const prize = interaction.options.getString("prize");

                client.giveawaysManager.start(interaction.channel, {
                    duration: ms(duration),
                    winnerCount: winners,
                    prize: prize,
                    messages: {
                        giveaway: "",
                        giveawayEnded: "",
                    }
                }).then(() => {
                    return interaction.reply({ content: `Your giveaway for **${prize}** has began!`, ephemeral: true });
                }).catch((err: any) => {
                    console.log(err);
                    return interaction.reply({ content: `There has been an error while starting this giveaway.`, ephemeral: true });
                });
            }
                break;
            case "end": {
                const messageID = interaction.options.getString("id");
                let giveaway = client.giveawaysManager.giveaways.find((g: any) => g.guildId === interaction.guildId && g.messageId === messageID);
                if (!giveaway) return interaction.reply({ content: "Cannot find a giveaway with that ID", ephemeral: true });

                client.giveawaysManager.end(messageID).then(() => {
                    return interaction.reply({ content: "Successfully ended giveaway", ephemeral: true });
                }).catch((err: any) => {
                    console.log(err);
                    return interaction.reply({ content: "An error has occured while trying to end this giveaway.", ephemeral: true });
                });
            }
                break;
            case "reroll": {
                const messageID = interaction.options.getString("id");
                let giveaway = client.giveawaysManager.giveaways.find((g: any) => g.guildId === interaction.guildId && g.messageId === messageID);
                if (!giveaway) return interaction.reply({ content: "Cannot find a giveaway with that ID", ephemeral: true });

                client.giveawaysManager.reroll(messageID).then(() => {
                    return interaction.reply({ content: "Successfully rerolled giveaway", ephemeral: true });
                }).catch((err: any) => {
                    console.log(err);
                    return interaction.reply({ content: "An error has occured while trying to reroll this giveaway.", ephemeral: true });
                });
            }
                break;
        }
    }
};