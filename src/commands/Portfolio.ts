import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

const model = require('../schemas/freelancer'),
    config = require("../config/config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("portfolio")
        .setDescription("Shows a freelancer's portfolio.")
        .addUserOption(option =>
            option.setName("freelancer")
                .setDescription("Which freelancer's portfolio would you like to view?")),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("freelancer") || interaction.user;
        const userData = await model.findOne({ user: user?.id }) || new model({ user: user?.id });

        const member = interaction.guild?.members.cache.find(u => u.id === user.id);
        if (!member?.roles.cache.find(role => role.id === config.roles.freelancer)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(config.errorColor)
                    .setAuthor({ name: `The selected user is not a freelancer!`, iconURL: `${interaction.guild?.iconURL()}` })],
                ephemeral: true
            });
        } else {
            const portfolioEmbed = new EmbedBuilder()
                .setAuthor({ name: `${user.username}'s Portfolio`, iconURL: `${user.avatarURL()}` })
                .setDescription(`${userData.portfolio}`)
                .setColor(config.embedColor)
                .setFooter({ text: `Mixelate | ${user.id}` })

            interaction.reply({
                embeds: [portfolioEmbed],
                ephemeral: true
            });
        }
    }
};