import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

const config = require('../../config/config.json'),
    messages = require('../../config/messages.json'),
    { startOrder, startApplication, requestSupport } = require('../../utils/helper'),
    model = require('../../schemas/freelancer'),
    ticketSchema = require('../../schemas/ticket'),
    ms = require("ms");

module.exports = async (client: Client, interaction: any) => {
    const Embed = new EmbedBuilder();
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        const splitArray = interaction.customId.split("-");
        const member = (await interaction.guild?.members.fetch())?.get(splitArray[2]);
        if (!member) return;

        const userData = await model.findOne({ user: member.id }) || new model({ user: member.id });

        if (splitArray[0] === "help") {
            switch (splitArray[1]) {
                case "client": {
                    interaction.update({
                        embeds: [Embed
                            .setColor(config.embedColor)
                            .setTitle(messages.help.embeds.client.title)
                            .setDescription(messages.help.embeds.client.description)
                        ],
                        ephemeral: true
                    });
                }
                    break;
                case "freelancer": {
                    interaction.update({
                        embeds: [Embed
                            .setColor(config.embedColor)
                            .setTitle(messages.help.embeds.freelancer.title)
                            .setDescription(messages.help.embeds.freelancer.description)
                        ],
                        ephemeral: true
                    });
                }
                    break;
                case "staff": {
                    interaction.update({
                        embeds: [Embed
                            .setColor(config.embedColor)
                            .setTitle(messages.help.embeds.staff.title)
                            .setDescription(messages.help.embeds.staff.description)
                        ],
                        ephemeral: true
                    });
                };
                    break;
            };
        } else if (splitArray[0] === "wallet") {
            switch (splitArray[1]) {
                case "earn": {
                    interaction.update({
                        embeds: [Embed
                            .setAuthor({ name: `${interaction.user.username}'s Wallet`, iconURL: `${interaction.user.avatarURL()}` })
                            .setDescription(`You have earned $${userData.totalEarnings.toFixed(2)} during your time at Mixelate!`)
                            .setColor(config.embedColor)
                        ],
                        ephemeral: true
                    });
                }
                    break;
                case "spend": {
                    interaction.update({
                        embeds: [Embed
                            .setAuthor({ name: `${interaction.user.username}'s Wallet`, iconURL: `${interaction.user.avatarURL()}` })
                            .setDescription(`You have spent $${userData.totalBalance.toFixed(2)} during your time at Mixelate!`)
                            .setColor(config.embedColor)
                        ],
                        ephemeral: true
                    });
                }
                    break;
                case "bal": {
                    interaction.update({
                        embeds: [Embed
                            .setAuthor({ name: `${interaction.user.username}'s Wallet`, iconURL: `${interaction.user.avatarURL()}` })
                            .setDescription(`Your wallet balance is $${userData.totalBalance.toFixed(2)}!`)
                            .setColor(config.embedColor)
                        ],
                        ephemeral: true
                    });
                }
                    break;
                case "draw": {
                    const embedModal = new ModalBuilder()
                        .setCustomId(`modal-draw-${interaction.member.user.id}`)
                        .setTitle(`Withdraw from Wallet`);
                    const amountInput = new TextInputBuilder()
                        .setCustomId(`modal-draw-amount`)
                        .setLabel(`How much would you like to withdraw?`)
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short);
                    const firstRow = new ActionRowBuilder().addComponents(amountInput);
                    // @ts-ignore
                    embedModal.addComponents(firstRow);
                    await interaction.showModal(embedModal);
                }
                    break;
                case "calc": {
                    const embedModal = new ModalBuilder()
                        .setCustomId(`modal-calc-${interaction.member.user.id}`)
                        .setTitle(`Commission Calculator`);
                    const amountInput = new TextInputBuilder()
                        .setCustomId(`modal-calc-amount`)
                        .setLabel(`What amount are your trying to calculate?`)
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short);
                    const firstRow = new ActionRowBuilder().addComponents(amountInput);
                    // @ts-ignore
                    embedModal.addComponents(firstRow);
                    await interaction.showModal(embedModal);
                }
                    break;
            }
        } else if (splitArray[0] === "ticket") {
            switch (splitArray[1]) {
                case "com": {
                    startOrder(client, interaction.guild, member, interaction);
                }
                    break;
                case "app": {
                    startApplication(client, interaction.guild, member, interaction);
                }
                    break;
                case "sup": {
                    requestSupport(client, interaction.guild, member, interaction);
                }
                    break;
                case "close": {
                    interaction.reply({
                        embeds: [new EmbedBuilder().setColor(config.embedColor).setAuthor({ name: `This ticket has been scheduled to close in ${ms(ms(`30m`))}.`, iconURL: `${interaction.guild?.iconURL()}` })]
                    }).then(async (msg: any) => {
                        setTimeout(function () {
                            interaction.channel.delete();
                        }, ms(`30m`));
                    });
                }
            }
        }
    } else if (interaction.isModalSubmit()) {
        const splitArray = interaction.customId.split("-");
        const member = (await interaction.guild?.members.fetch())?.get(splitArray[2]);
        const userData = await model.findOne({ user: member.id }) || new model({ user: member.id });
        switch (splitArray[1]) {
            case "draw": {
                const amount = interaction.fields.getTextInputValue("modal-draw-amount");
                if (!amount) return;
                if (amount <= userData.availableBalance) {

                }
                interaction.update({
                    embeds: [Embed
                        .setColor(config.embedColor)
                        .setDescription("WHIP")
                    ]
                });
            }
                break;
            case "calc": {
                const amount = interaction.fields.getTextInputValue("modal-calc-amount");
                if (isNaN(amount)) return interaction.update({
                    embeds: [Embed
                        .setColor(config.errorColor)
                        .setAuthor({ name: "Please enter a valid number to calculate!", iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                let calc = amount - (amount * .15);
                let calc2 = amount / .85;
                interaction.update({
                    embeds: [Embed.setAuthor({ name: `Commission Calculator`, iconURL: `${interaction.guild?.iconURL()}` })
                        .setDescription(`You will get \`$${calc.toFixed(2)}\` of \`$${parseFloat(amount).toFixed(2)}\`.\n\nTo receive \`$${parseFloat(amount).toFixed(2)}\`, charge \`$${calc2.toFixed(2)}\``)
                        .setColor(config.embedColor)
                        .setFooter({
                            text: "Freelancer Cut: 85%"
                        })],
                    ephemeral: true
                })
            }
                break;
        }
    } else if (interaction.isStringSelectMenu()) {
        const selected = interaction.values[0].split("-")
        if (selected[0] === "support") {
            const button = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket-close-${interaction.member.user.id}`)
                        .setLabel("Close")
                        .setEmoji("🔒")
                        .setStyle(ButtonStyle.Danger),
                );
            const embed = new EmbedBuilder()
                .setTitle("Support Ticket")
                .setDescription("Please provide any additional information that could be useful to our support team. You will be notified when you receive a response!")
                .addFields({
                    name: "Quick tips while you wait",
                    value: "\`\`\`- Need quick access to your ticket menu? Use /ticket menu\n\n- Is someone else involved in this ticket? Use /ticket invite\`\`\`"
                })
                .setFooter({ text: "On average our team responds within 5 minutes." })
                .setColor(config.embedColor)

            const support = interaction.guild.roles.cache.find((r: any) => r.id === config.roles.support);
            switch (selected[1]) {
                case "transaction": {
                    embed.addFields({
                        name: "Details",
                        value: "\`\`\`Support for a transaction dispute\`\`\`"
                    });
                    interaction.update({
                        content: `${support}`,
                        embeds: [embed],
                        components: [button]
                    });
                }
                    break;
                case "commission": {
                    embed.addFields({
                        name: "Details",
                        value: "\`\`\`Support for a commission\`\`\`"
                    });
                    interaction.update({
                        content: `${support}`,
                        embeds: [embed],
                        components: [button]
                    });
                }
                    break;
                case "partnership": {
                    embed.addFields({
                        name: "Details",
                        value: "\`\`\`Questions regarding a partnership\`\`\`"
                    });
                    interaction.update({
                        content: `${support}`,
                        embeds: [embed],
                        components: [button]
                    });
                }
                    break;
                case "update": {
                    embed.addFields({
                        name: "Details",
                        value: "\`\`\`Support for updating payment details\`\`\`"
                    });
                    interaction.update({
                        content: `${support}`,
                        embeds: [embed],
                        components: [button]
                    });
                }
                    break;
                case "other": {
                    embed.addFields({
                        name: "Details",
                        value: "\`\`\`Other inquiry needing support\`\`\`"
                    });
                    interaction.update({
                        content: `${support}`,
                        embeds: [embed],
                        components: [button]
                    });
                }
                    break;
            }
        } else if (selected[0] === "application") {
            const ticketData = await ticketSchema.findOne({ channelID: interaction.channel.id }) || new ticketSchema({ channelID: interaction.channel.id, ticketID: "1" });
            if (!ticketData) return console.log(interaction.channel.id);
            let test = ["709283142611107848", "709861236711358594"]
            // let final: any[] = []

            // test.forEach((element: string) => {
            // 	const role =interaction.guild.roles.cache.find((r: any) => r.id === element);
            // 	final.push(role);
            // });

            const embed = new EmbedBuilder()
                .setTitle("Mixelate Applications")
                .setColor(config.embedColor)
                .setFooter({ text: `Please answer below` })

            const filter = (m: any) => m.author.id === interaction.member.id;
            const collector = interaction.channel.createMessageCollector({ filter, time: 600000 });

            switch (selected[1]) {
                case "freelancer": {
                    ticketData.questions = selected[1];
                    await ticketData.save();
                    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('application1')
                                .setPlaceholder('Choose a department...')
                                .addOptions({
                                    label: "🎨 Design",
                                    description: "Illustrator, GFX, Skin, Model Designer, Render, Vector, Texture, Artist",
                                    // description: "Illustrator, GFX, Skin, Model Designer, Render, Vector, Texture Artist",
                                    value: `application-design-${interaction.member.id}`
                                }, {
                                    label: "💻 Development",
                                    description: "App, Bot, Plugin, Data Pack, Mod Developer",
                                    value: `application-dev-${interaction.member.id}`
                                }, {
                                    label: "🌐 Web",
                                    description: "Forum, Pterodactyl, Store, UIX, Web, Wix Designer, Web Developer",
                                    value: `application-web-${interaction.member.id}`
                                }, {
                                    label: "🔧 Setups",
                                    description: "Configurator, Discord, Forum, Server, Store Setup, Sys Admin",
                                    value: `application-set-${interaction.member.id}`
                                }, {
                                    label: "📹 Video",
                                    description: "Content, Intro, Trailer Creator, Animator, Motion Designer, Video Editor",
                                    value: `application-vid-${interaction.member.id}`
                                }, {
                                    label: "🖊️ Creative",
                                    description: "Writer, Builder, Terraformer, Organic Builder",
                                    value: `application-create-${interaction.member.id}`
                                })
                        );
                    embed.setDescription("Which department are you applying under?");
                    interaction.update({
                        embeds: [embed],
                        components: [row]
                    });
                }
                    break;
                case "design": {
                    embed.setDescription("What is your year of age?");

                    collector.on('collect', (m: any) => {
                        m.delete();
                        collector.stop();

                        console.log(m.content)
                    });
                    collector.on('end', (collected: any) => {
                        if (collected.size === 0) return interaction.channel.delete();
                        embed.setDescription(null)
                        embed.setDescription("What is the link to your portfolio?");
                        interaction.update({
                            embeds: [embed],
                        });
                    })
                }
                    break;
            }
        }
    }
}