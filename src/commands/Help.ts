import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const { SlashCommandBuilder } = require("discord.js");
const config = require("../config/config.json"),
    messages = require("../config/messages.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays the help panel with all the commands Mixelate has!"),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction: ChatInputCommandInteraction) {
        if (interaction.member == null) return;
        const buttons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`help-client-${interaction.member.user.id}`)
                    .setLabel(messages.help.buttons.client.text)
                    .setEmoji(messages.help.buttons.client.emoji)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`help-freelancer-${interaction.member.user.id}`)
                    .setLabel(messages.help.buttons.freelancer.text)
                    .setEmoji(messages.help.buttons.freelancer.emoji)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`help-staff-${interaction.member.user.id}`)
                    .setLabel(messages.help.buttons.staff.text)
                    .setEmoji(messages.help.buttons.staff.emoji)
                    .setStyle(ButtonStyle.Secondary),
            );

        const helpEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(messages.help.embeds.main.title)
            .setDescription(messages.help.embeds.main.description)
        interaction.reply({ 
            ephemeral: true, 
            embeds: [helpEmbed], 
            components: [buttons] 
        });
    }
};