import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
const ms = require("ms"),
    manager = require("../Bot");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Default description")
        .addSubcommand(option =>
            option.setName("start")
                .setDescription("Start a giveaway!")
                .addStringOption(option =>
                    option.setName("duration")
                        .setDescription("How long would you like this giveaway to last?")
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName("winners")
                        .setDescription("How many players would you like to win?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("prize")
                        .setDescription("What is the prize of this giveaway?")
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
                
                manager.start(interaction.channel, {
                        duration: ms(duration),
                        winners,
                        prize
                    })
                    .then((data: any) => {
                        console.log(data);
                    });
            }
        }
    }
};