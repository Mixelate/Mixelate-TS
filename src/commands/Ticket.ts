import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";
import { createTranscript } from "discord-html-transcripts";

const ticketSchema = require('../schemas/ticket');
const commissionSchema = require('../schemas/commission');
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
                .setDescription("Deny an application.")
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("What can this user do to better his chances of acceptance?"))),
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
            case "begin": {
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
                const ticketData = await ticketSchema.findOne({ channelID: interaction.channel?.id }) ||  await commissionSchema.findOne({ channelID: interaction.channel?.id });
                const user = interaction.guild?.members.cache.find(u => u.id === ticketData.userID);
                const staff = interaction.guild?.members.cache.find(u => u.id === ticketData.staffID);
                if (!ticketData) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Ticket not found in database, contact an administrator.`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });

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
                    setTimeout(async function () {
                        createTranscript(interaction.channel as TextChannel, {
                            // @ts-ignore
                            returnType: "attachment",
                            minify: true,
                            useCDN: true
                        }).then(async attachment => {
                            // @ts-ignore
                            channel.send({
                                // @ts-ignore
                                embeds: [new EmbedBuilder().setColor(config.embedColor).setTitle(`${interaction.channel?.name.startsWith("commission") ? "Completed Commission" : "Ticket Closed"}`)
                                    // @ts-ignore
                                    .setDescription(`#${interaction.channel?.name} has been marked as complete, and the transcript has been attached.`)
                                    .addFields({
                                        name: "Ticket Name",
                                        // @ts-ignore
                                        value: `#${interaction.channel?.name}`,
                                        inline: true
                                    }, {
                                        name: "Client",
                                        value: `${user}`,
                                        inline: true
                                    }, {
                                        name: "Commission Manager",
                                        value: `${staff != null ? staff : "Not Assigned"}`,
                                        inline: true
                                    })],
                                files: [attachment]
                            });
                        });
                        await ticketSchema.findOneAndDelete({ channelID: interaction.channel?.id }, { useFindAndModify: false });
                        await commissionSchema.findOneAndDelete({ channelID: interaction.channel?.id }, { useFindAndModify: false });
                        interaction.channel?.delete();
                    }, ms(time))
                });
            }
                break;
            case "complete": {
                const user = interaction.user;
                const commissionData = await commissionSchema.findOne({ channelID: interaction.channel?.id });
                const freelancer = interaction.guild?.members.cache.find(f => f.id === commissionData.freelancerID);
                const service = interaction.guild?.roles.cache.find(r => r.id === commissionData.roleID);

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
                    .setFooter({ text: `$${commissionData.charge.toFixed(2)} has been added to ${freelancer?.user.username} wallet.` })
                const embed2 = new EmbedBuilder()
                    .setDescription(`Please leave a rating for ${freelancer?.user.username}`)
                    .setColor(config.embedColor)
                    .setFooter({ text: `Note: Reviews will be posted in a public channel.` })

                interaction.channel?.send({
                    embeds: [embed, embed2]
                }).then((msg) => {
                    interaction.reply({
                        content: "Successfully marked this commission as completed!",
                        ephemeral: true
                    });
                    // msg.react("1⃣").then(() => msg.react("2⃣").then(() => msg.react("3⃣").then(() => msg.react("4⃣").then(() => msg.react("5⃣"))))).then(() => {
                    //     msg.awaitReactions((reaction: any, usr: any) => ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣"].includes(reaction.emoji.name) && usr.id === commissionData.userID, {
                    //         time: parseFloat(config.review.time) * 60 * 1000,
                    //         max: 1
                    //     });
                    // });
                })
            }
                break;
            case "accept": {
                const member = interaction.guild?.members.cache.find(u => u.id === interaction.user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.reviewer)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only application reviewers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                const ticketData = await ticketSchema.findOne({ channelID: interaction.channel?.id });
                const role = interaction.guild?.roles.cache.find(r => r.id === ticketData.roleID);
                const freelancer = interaction.guild?.roles.cache.find(r => r.id === config.roles.freelancer);
                const user = interaction.guild?.members.cache.find(u => u.id === ticketData.userID);

                // @ts-ignore
                user?.roles.add(role);
                // @ts-ignore
                user?.roles.add(freelancer);

                const embed = new EmbedBuilder()
                    .setTitle("Application Accepted")
                    .setDescription("Congratulations! We have reviewed your application and would love to have you on our team!")
                    .addFields({
                        name: "Before you get started, please complete the steps below",
                        value: "\`\`\`- Set up your freelancer profile! Use /profile menu\n\n- Read the documents in #guidelines for ticket process, regulations, and more.\`\`\`"
                    })
                    .setFooter({ text: "Let us know when you have completed these steps" })

                interaction.reply({
                    content: "Applicant successfully accepted!"
                });
                interaction.channel?.send({
                    content: `${user}`,
                    embeds: [embed]
                }).then(() => {
                    setTimeout(function () {
                        interaction.channel?.delete();
                    }, 86400000)
                })
            }
                break;
            case "deny": {
                const member = interaction.guild?.members.cache.find(u => u.id === interaction.user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.reviewer)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only application reviewers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                const ticketData = await ticketSchema.findOne({ channelID: interaction.channel?.id });
                const user = interaction.guild?.members.cache.find(u => u.id === ticketData.userID);
                const reason = interaction.options.getString("reason");

                const embed = new EmbedBuilder()
                    .setTitle("Application Denied")
                    .setDescription("We're sorry to inform you at this time, we will not be pursing your candicacy for this role.")
                    .addFields({
                        name: "Please feel free to reapply after the following steps",
                        value: `\`\`\`${reason}\`\`\``
                    })
                    .setFooter({ text: "This channel will automatically be closed in 24 hours" })

                interaction.reply({
                    embeds: [embed]
                }).then(() => {
                    setTimeout(function () {
                        interaction.channel?.delete();
                    }, 86400000)
                })

            }
                break;
        }
    }
};