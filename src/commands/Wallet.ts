import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

const freelancerSchema = require('../schemas/freelancer'),
    config = require("../config/config.json"),
    messages = require("../config/messages.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wallet")
        .setDescription("Default description.")
        .addSubcommand(option =>
            option.setName("menu")
                .setDescription("Open menu to view all your wallet information."))
        .addSubcommand(option =>
            option.setName("withdraw")
                .setDescription("Withdraw funds from your wallet.")
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("How much would you like to withdraw?")
                        .setRequired(true)
                        .setMinValue(10)))
        .addSubcommand(option =>
            option.setName("spendings")
                .setDescription("View all your spendings to Mixelate!"))
        .addSubcommand(option =>
            option.setName("earnings")
                .setDescription("View all your earnings from Mixelate!"))
        .addSubcommand(option =>
            option.setName("balance")
                .setDescription("View your current balance!"))
        .addSubcommand(option =>
            option.setName("calculate")
                .setDescription("Calculates payment after PayPal and Mixelate Fees!")
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("What amount are your trying to calculate?")
                        .setRequired(true))),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.member == null) return;
        const subCommand = interaction.options.getSubcommand();
        const user = interaction.user;
        const userData = await freelancerSchema.findOne({ user: user?.id }) || new freelancerSchema({ user: user?.id });

        switch (subCommand) {
            case "menu": {
                const buttons = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`wallet-earn-${interaction.member.user.id}`)
                            .setLabel(messages.wallet.buttons.earnings.text)
                            .setEmoji(messages.wallet.buttons.earnings.emoji)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`wallet-spend-${interaction.member.user.id}`)
                            .setLabel(messages.wallet.buttons.spendings.text)
                            .setEmoji(messages.wallet.buttons.spendings.emoji)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`wallet-bal-${interaction.member.user.id}`)
                            .setLabel(messages.wallet.buttons.balance.text)
                            .setEmoji(messages.wallet.buttons.balance.emoji)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`wallet-draw-${interaction.member.user.id}`)
                            .setLabel(messages.wallet.buttons.withdraw.text)
                            .setEmoji(messages.wallet.buttons.withdraw.emoji)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`wallet-calc-${interaction.member.user.id}`)
                            .setLabel(messages.wallet.buttons.calculator.text)
                            .setEmoji(messages.wallet.buttons.calculator.emoji)
                            .setStyle(ButtonStyle.Secondary));
                const menuEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${user.username}'s Wallet`, iconURL: `${interaction.user.avatarURL()}` })
                    .setColor(config.embedColor);
                return interaction.reply({
                    embeds: [menuEmbed],
                    components: [buttons],
                    ephemeral: true
                });
            }
                break;
            case "calculate": {
                const amount = interaction.options.getInteger('amount');
                if (!amount) return;
                let calc = amount - (amount * .15);
                let calc2 = amount / .85;

                const calcEmbed = new EmbedBuilder()
                    .setAuthor({ name: `Commission Calculator`, iconURL: `${interaction.guild?.iconURL()}` })
                    .setDescription(`You will get \`$${calc.toFixed(2)}\` of \`$${amount.toFixed(2)}\`.\n\nTo receive \`$${amount.toFixed(2)}\`, charge \`$${calc2.toFixed(2)}\``)
                    .setColor(config.embedColor)
                    .setFooter({
                        text: "Freelancer Cut: 85%"
                    });

                await interaction.reply({
                    embeds: [calcEmbed],
                    ephemeral: true
                });
            }
                break;
            case "earnings": {
                const earnEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${user.username}'s Wallet`, iconURL: `${user.avatarURL()}` })
                    .setDescription(`During your time at Mixelate, you have earned:\n\`\`\`$${userData.totalEarnings.toFixed(2)}\`\`\``)
                    .setColor(config.embedColor)
                    .setFooter({ text: `Mixelate | ${user.id}` })

                await interaction.reply({
                    embeds: [earnEmbed],
                    ephemeral: true
                });
            }
                break;
            case "spendings": {
                // whip: find how to extract spendings from user
                const spendEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${user.username}'s Wallet`, iconURL: `${user.avatarURL()}` })
                    .setDescription(`During your time at Mixelate, you have spent:\n\`\`\`$${userData.totalBalance.toFixed(2)}\`\`\``)
                    .setColor(config.embedColor)
                    .setFooter({ text: `Mixelate | ${user.id}` })

                await interaction.reply({
                    embeds: [spendEmbed],
                    ephemeral: true
                });
            }
                break;
            case "balance": {
                const balEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${user.username}'s Wallet`, iconURL: `${user.avatarURL()}` })
                    .setDescription(`Your current USD balance is:\n\`\`\`$${userData.availableBalance.toFixed(2)}\`\`\``)
                    .setColor(config.embedColor)
                    .setFooter({ text: `Mixelate | ${user.id}` })

                await interaction.reply({
                    embeds: [balEmbed],
                    ephemeral: true
                });
            }
                break;
            case "withdraw": {
                const amount = interaction.options.getInteger('amount');
                if (!amount) return;

                if (amount <= userData.availableBalance) {
                    const button = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setURL(`${userData.paypal + amount}`)
                                .setLabel('Payout'),
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Danger)
                                .setCustomId(`withdraw-reject-${user.id}`)
                                .setLabel('Reject'));
                    const drawEmbed = new EmbedBuilder()
                        .setAuthor({ name: "Payout Request", iconURL: `${interaction.guild?.iconURL()}` })
                        .setDescription(`${user} has requested a withdrawal from his wallet.`)
                        .setColor(config.embedColor)
                        .addFields({
                            name: "Freelancer",
                            value: `${user.tag}`,
                            inline: true
                        }, {
                            name: "Amount",
                            value: `$${amount}`,
                            inline: true
                        }, {
                            name: "PayPal Email",
                            value: `${userData.email}`,
                            inline: true
                        })
                    const channel = interaction.guild?.channels.cache.find(c => c.id === config.channels.payout);
                    if (!channel) return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(config.errorColor)
                            .setAuthor({ name: "Payout channel not found, please contact an administrator.", iconURL: `${interaction.guild?.iconURL()}` })]
                    });
                    freelancerSchema.findOneAndUpdate({
                        user: user.id
                    }, {
                        user: user.id,
                        availableBalance: userData.availableBalance - amount
                    }, {
                        upsert: true
                    }, () => {
                        // @ts-ignore 
                        channel.send({
                            embeds: [drawEmbed],
                            components: [button]
                        });
                        return interaction.reply({
                            embeds: [new EmbedBuilder()
                                .setColor(config.embedColor)
                                .setAuthor({ name: "Wallet withdrawal successfully requested!", iconURL: `${interaction.guild?.iconURL()}` })],
                            ephemeral: true
                        });
                    })
                } else {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(config.errorColor)
                            .setAuthor({ name: "The amount requested must be less than or equal to your current balance.", iconURL: `${interaction.guild?.iconURL()}` })],
                        ephemeral: true
                    });
                }
            }
        }
    }
};