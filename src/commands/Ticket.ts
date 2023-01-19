import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Embed, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";
import { createTranscript } from "discord-html-transcripts";

const ms = require("ms"),
    config = require("../config/config.json"),
    messages = require("../config/messages.json"),
    { generateInvoice, isTicket } = require("../utils/helper");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Default Description")
        .addSubcommand(option =>
            option.setName("panel")
                .setDescription("Generates Mixelate ticket creation panel."))
        .addSubcommand(option =>
            option.setName("leave")
                .setDescription("Leave and repost ticket to be claimed by a different freelancer."))
        .addSubcommand(option =>
            option.setName("repost")
                .setDescription("Reposts a ticket to be re-claimed by a different freelancer."))
        .addSubcommand(option =>
            option.setName("addcharge")
                .setDescription("Creates an additional invoice.")
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("What is the price of this additional charge?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("newprice")
                .setDescription("Set the new price of a commission.")
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("What is the new price?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("begin")
                .setDescription("Begin the commission process.")
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("What is being charged for the commission?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("invite")
                .setDescription("Add an additional user to a ticket.")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Which user would you like to add?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("transcript")
                .setDescription("Generates a transcript for a ticket."))
        .addSubcommand(option =>
            option.setName("close")
                .setDescription("Close a ticket after the specified duration.")
                .addStringOption(option =>
                    option.setName("time")
                        .setDescription("After how long would you like this ticket to close?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("complete")
                .setDescription("Complete the commission and send additional resources."))
        .addSubcommand(option =>
            option.setName("accept")
                .setDescription("Accept an application and apply appropriate roles."))
        .addSubcommand(option =>
            option.setName("deny")
                .setDescription("Deny an application.")),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction: ChatInputCommandInteraction) {
        const subCommand = interaction.options.getSubcommand();

        if (!isTicket(interaction.channel)) return interaction.reply({
            embeds: [new EmbedBuilder().setColor(config.errorColor).setAuthor({
                name: "This command can only be sent inside of a ticket!",
                iconURL: `${interaction.guild?.iconURL()}`
            })],
            ephemeral: true
        });
        switch (subCommand) {
            case "panel": {
                if (interaction.member == null) return;
                const buttons = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`ticket-com-${interaction.member.user.id}`)
                            .setLabel(messages.ticket.panel.buttons.commission.text)
                            .setEmoji(messages.ticket.panel.buttons.commission.emoji)
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`ticket-app-${interaction.member.user.id}`)
                            .setLabel(messages.ticket.panel.buttons.application.text)
                            .setEmoji(messages.ticket.panel.buttons.application.emoji)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`ticket-sup-${interaction.member.user.id}`)
                            .setLabel(messages.ticket.panel.buttons.support.text)
                            .setEmoji(messages.ticket.panel.buttons.support.emoji)
                            .setStyle(ButtonStyle.Secondary),
                    );

                interaction.channel?.send({
                    content: `https://imgur.com/nIKPYG7`,
                    components: [buttons]
                });
                await interaction.reply({
                    content: "Ticket panel successfully sent!",
                    ephemeral: true
                });
            }
                break;
            case 'begin': {
                const member = interaction.guild?.members.cache.find(u => u.id === interaction.user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.commission)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only commission managers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                let amount = interaction.options.getInteger("amount");
                if (!amount || isNaN(amount) || amount < 1) {
                    return;
                }
                // @ts-ignore
                amount = parseFloat(amount);
                amount = Math.round((amount + Number.EPSILON) * 100) / 100;

                return generateInvoice(interaction, amount);
            }
                break;
            case "invite": {
                const user = interaction.options.getUser("user");
                const member = interaction.guild?.members.cache.find(u => u.id === interaction.user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.commission)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only commission managers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                // @ts-ignore
                interaction.channel.permissionOverwrites.create(user, {
                    SendMessages: true,
                    ViewChannel: true,
                    ReadMessageHistory: true,
                    AttachFiles: true,
                    EmbedLinks: true
                });
                await interaction.reply({
                    embeds: [new EmbedBuilder().setColor(config.embedColor).setAuthor({ name: `${user?.tag} was added to this ticket.`, iconURL: `${interaction.guild?.iconURL()}` })],
                });
            }
                break;
            case "transcript": {
                createTranscript(interaction.channel as TextChannel, {
                    // @ts-ignore
                    returnType: "attachment",
                    minify: true,
                    useCDN: true
                }).then(async attachment => {
                    await interaction.reply({
                        embeds: [new EmbedBuilder().setColor(config.embedColor).setAuthor({ name: "The transcript for this ticket has been attached, feel free to download and save it for your records.", iconURL: `${interaction.guild?.iconURL()}` })],
                        files: [attachment]
                    });
                });
            }
                break;
            case "close": {
                const member = interaction.guild?.members.cache.find(u => u.id === interaction.user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.commission)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only commission managers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                const time = interaction.options.getString("time");
                const channel = interaction.guild?.channels.cache.find(c => c.id === config.channels.transcript);
                if (!channel) return interaction.reply({
                    embeds: [new EmbedBuilder().setColor(config.errorColor).setAuthor({ name: "Transcript log channel not found, please contact an administrator", iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                if (!ms(time)) return interaction.reply({
                    embeds: [new EmbedBuilder().setColor(config.errorColor).setAuthor({ name: "Please enter a valid time (ex. 1d, 12hrs)", iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                interaction.reply({
                    embeds: [new EmbedBuilder().setColor(config.embedColor).setAuthor({ name: `This ticket has been scheduled to close in ${ms(ms(time))}.`, iconURL: `${interaction.guild?.iconURL()}` })]
                }).then(async msg => {
                    setTimeout(function () {
                        createTranscript(interaction.channel as TextChannel, {
                            // @ts-ignore
                            returnType: "attachment",
                            minify: true,
                            useCDN: true
                        }).then(async attachment => {
                            // @ts-ignore
                            channel.send({
                                embeds: [new EmbedBuilder().setColor(config.embedColor).setTitle("Completed Commission")
                                    .setDescription(`${interaction.channel?.toString()} has been marked as complete, and the transcript has been attached.`)
                                    .addFields({
                                        name: "Ticket Name",
                                        // @ts-ignore
                                        value: `${interaction.channel?.name}`,
                                        inline: true
                                    }, {
                                        name: "Client",
                                        value: `WHIP`,
                                        inline: true
                                    }, {
                                        name: "Commission Manager",
                                        value: `WHIP`,
                                        inline: true
                                    })],
                                files: [attachment]
                            });
                        });
                        interaction.channel?.delete();
                    }, ms(time))
                });
            }
                break;
            case "complete": {
                const user = interaction.user;
                const member = interaction.guild?.members.cache.find(u => u.id === user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.commission)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only commission managers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                const embed = new EmbedBuilder()
                    .setTitle("Commission Complete!")
                    .setDescription(`${user} has marked this commission as complete.\n\nOnce the final product is received, you have up to 72 hours to receive a partial refund.`)
                    .setColor(config.embedColor)
                    .setFooter({ text: `AMOUNT has been added to FREELANCERS wallet.` })
                const embed2 = new EmbedBuilder()
                    .setDescription(`Please leave a rating for FREELANCER`)
                    .setColor(config.embedColor)
                    .setFooter({ text: `Note: Reviews will be posted in a public channel.` })

                interaction.channel?.send({
                    embeds: [embed, embed2]
                });
                return interaction.reply({
                    content: "Successfully marked this commission as completed!",
                    ephemeral: true
                });
            }
                break;
            case "accept": {
                const user = interaction.options.getUser("user");
                const member = interaction.guild?.members.cache.find(u => u.id === interaction.user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.reviewer)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only application reviewers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
            }
                break;
            case "deny": {
                const user = interaction.options.getUser("user");
                const member = interaction.guild?.members.cache.find(u => u.id === interaction.user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.reviewer)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only application reviewers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
            }
                break;
        }
    }
};