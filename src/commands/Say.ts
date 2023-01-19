import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

const config = require("../config/config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("say")
        .setDescription("Send a embed message!")
        .addStringOption(option =>
            option.setName('format')
                .setDescription('Do you want to send a plain or embed message?')
                .setRequired(true)
                .addChoices({
                    name: 'Plain',
                    value: 'plain'
                }, {
                    name: 'Embed',
                    value: 'embed'
                }))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('What message do you want to send?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('What do you want the title of the embed to be?'))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('What role do you want to ping?')),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.member == null) return;

        const member = interaction.guild?.members.cache.find(u => u.id === interaction.user.id);
        if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setAuthor({ name: "Only Officers may use this command!", iconURL: `${interaction.guild?.iconURL()}` })],
                ephemeral: true
            });
        }

        const format = interaction.options.getString('format');
        const msg = interaction.options.getString('message');
        const title = interaction.options.getString('title');
        const role = interaction.options.getRole('role');

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(config.embedColor)
                .setAuthor({ name: "Your message was successfully sent!", iconURL: `${interaction.guild?.iconURL()}` })],
            ephemeral: true
        });
        switch (format) {
            case "plain": {
                if (role === null) {
                    return interaction.channel?.send({
                        content: `${msg}`
                    });
                } else {
                    return interaction.channel?.send({
                        content: `${role} \n \n ${msg}`
                    });
                }
            }
                break;
            case "embed": {
                if (role === null) {
                    if (title === null) {
                        return interaction.channel?.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(config.embedColor)
                                    .setDescription(`${msg}`)
                            ]
                        });
                    } else {
                        return interaction.channel?.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(config.embedColor)
                                    .setTitle(`${title}`)
                                    .setDescription(`${msg}`)
                            ]
                        });
                    }
                } else {
                    if (title === null) {
                        return interaction.channel?.send({
                            content: `${role}`,
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(config.embedColor)
                                    .setDescription(`${msg}`)
                            ]
                        });
                    } else {
                        return interaction.channel?.send({
                            content: `${role}`,
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(config.embedColor)
                                    .setTitle(`${title}`)
                                    .setDescription(`${msg}`)
                            ]
                        });
                    }
                }
            }
        }
    }
};