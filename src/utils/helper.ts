import { Client, Guild, GuildMember, Role, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, MessageCollector } from "discord.js";
const config = require('../config/config.json'),
    messages = require('../config/messages.json'),
    ticketSchema = require('../schemas/ticket'),
    freelancer = require('../schemas/freelancer'),
    paypal = require("paypal-rest-sdk");

function hasRoles(member: any, roleArray: any, ignoreAdminOverride: boolean) {
    try {
        return member.roles.cache.some((r: any) => roleArray.includes(r.name) || member.roles.cache.some((r: any) => roleArray.includes(r.id))) || ((!ignoreAdminOverride && config.permissions.ignoreAdmin) ? member.permissions.has("ADMINISTRATOR") : false);
    } catch (err: any) {
        return console.log(err.message);
    }
}

function isTicket(channel: any) {
    if (!channel || !channel.name) return false;
    return (channel.name.startsWith(config.tickets.layout.application || "application-") ||
        channel.name.startsWith(config.tickets.layout.support || "support-") ||
        channel.name.startsWith(config.tickets.layout.commission || "order-") ||
        channel.name.startsWith("ticket-"))
}

function printRoles(array: String[], interaction: any) {
    let roles: any[] = []
    array.forEach((element: String) => {
        const role = interaction.guild.roles.cache.find((r: any) => r.id === element);
        roles.push(role);
    });
    return roles;
}

function startOrder(client: Client, guild: Guild, member: GuildMember, interaction: any) {
    const parent = guild.channels.cache.find(c => c.id == config.categories.commission);
    // @ts-ignore
    parent?.children.create({
        name: `${config.tickets.layout.commission}${member.user.username}`,
        type: 0,
        topic: `Client: ${member.user.username} (${member.user.id})`,
        permissionOverwrites: [{
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }, {
            id: client.user?.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
        }, {
            id: member.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
        }, ...config.tickets.roles.commission.filter((a: any) => guild.roles.cache.find(b => b.id === a) || guild.roles.cache.get(a)).map((c: any) => {
            return {
                id: (guild.roles.cache.find(d => d.id === c) || guild.roles.cache.get(c))?.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            }
        })]
    }).then((channel: any) => {
        const ticketData = new ticketSchema({
            channelID: channel.id,
            user: member.id,
            role: "",
            budget: "",
            questions: [],
        });
        const embed = new EmbedBuilder()
            .setTitle(messages.ticket.commission.role.title)
            .setDescription(messages.ticket.commission.role.description)
            .setColor(config.embedColor)
        interaction.channel.send({
            embeds: [embed]
        }).then((msg: any) => {
            const filter = (user: any) => {
                return user.id === interaction.user.id
            }
            const collectOne = interaction.channel.createMessageCollector({ filter, time: 30000 });
            collectOne.on('collect', (m: any) => {
                m.delete();
                if (m.mentions.roles.first() && config.commissions.roles.find((r: any) => r === m.mentions.roles.first().name)) {
                    ticketData.roleID = m.mentions.roles.first().id
                    collectOne.stop();
                } else {
                    interaction.channel.send({
                        content: "Invalid mention! Please try again."
                    }).then((msg: any) => {
                        msg.delete({
                            timeout: 5000
                        });
                    });
                }
            });
            collectOne.on('end', () => {

            })
        })

    });
}

function startApplication(client: Client, guild: Guild, member: GuildMember, interaction: any) {
    const parent = guild.channels.cache.find(c => c.id == config.categories.application);
    // @ts-ignore
    parent?.children.create({
        name: `${config.tickets.layout.application}${member.user.username}`,
        type: 0,
        topic: `Applicant: ${member.user.username} (${member.user.id})`,
        permissionOverwrites: [{
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }, {
            id: client.user?.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
        }, {
            id: member.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
        }, ...config.tickets.roles.application.filter((a: any) => guild.roles.cache.find(b => b.id === a) || guild.roles.cache.get(a)).map((c: any) => {
            return {
                id: (guild.roles.cache.find(d => d.id === c) || guild.roles.cache.get(c))?.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            }
        })]
    }).then((channel: any) => {
        const ticketData = new ticketSchema({
            ticketID: channel.id,
            channelID: channel.id,
            userID: member.id,
            questions: [],
        });
        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('application0')
                    .setPlaceholder('Choose a department...')
                    .addOptions({
                        label: "🎨 Freelancer",
                        description: "Join our prestigous team of freelancers.",
                        value: `application-freelancer-${member.id}`
                    }, {
                        label: "🔨 Staff",
                        description: "Work alongside our executives.",
                        value: `application-staff-${member.id}`
                    })
            );
        const design = config.tickets.departments.design;
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle("What position are you applying for?")
            .setFooter({ text: `Please select an option below` })

        interaction.reply({
            content: `Your application has been successfully opened in ${channel}!`,
            ephemeral: true
        });

        ticketData.roleID = ""
        ticketData.save();
        channel.send({
            content: `${member}`,
            embeds: [embed],
            components: [row]
        }).catch((err: any) => {
            channel.send({
                content: "There has been an error creating your ticket."
            });
            console.log(err);
        });
    });
}

function requestSupport(client: Client, guild: Guild, member: GuildMember, interaction: any) {
    const parent = guild.channels.cache.find(c => c.id == config.categories.support);
    // @ts-ignore
    parent?.children.create({
        name: `${config.tickets.layout.support}${member.user.username}`,
        type: 0,
        topic: `Requestor: ${member.user.username} (${member.user.id})`,
        permissionOverwrites: [{
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }, {
            id: client.user?.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
        }, {
            id: member.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
        }, ...config.tickets.roles.support.filter((a: any) => guild.roles.cache.find(b => b.id === a) || guild.roles.cache.get(a)).map((c: any) => {
            return {
                id: (guild.roles.cache.find(d => d.id === c) || guild.roles.cache.get(c))?.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
            }
        })]
    }).then((channel: any) => {
        const ticketData = new ticketSchema({
            ticketID: channel.id,
            channelID: channel.id,
            userID: member.id,
            questions: [],
        });
        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('support')
                    .setPlaceholder('Choose an option...')
                    .addOptions({
                        label: "💳 Transaction Dispute",
                        description: "Need to dispute a recent transaction?",
                        value: `support-transaction-${member.id}`
                    }, {
                        label: "🎫 Commission Support",
                        description: "Need help with a current/past commission?",
                        value: `support-commission-${member.id}`
                    }, {
                        label: "🤝 Partnership",
                        description: "Interested in becoming partners with Mixelate?",
                        value: `support-partnership-${member.id}`
                    }, {
                        label: "📜 Update Payment Details",
                        description: "Want to update your payment details?",
                        value: `support-update-${member.id}`
                    }, {
                        label: "📩 Other Inquiry",
                        description: "Is your concern not listed above?",
                        value: `support-other-${member.id}`
                    })
            );
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle("Support Ticket")
            .setDescription("Thank you for creating a support request.\n\nPlease select an option so we can best assist you.")
            .setFooter({ text: `${member.user.id}` })

        interaction.reply({
            content: `Your ticket has been successfully created in ${channel}!`,
            ephemeral: true
        });
        
        ticketData.roleID = ""
        ticketData.save();
        channel.send({
            embeds: [embed],
            components: [row]
        }).catch((err: any) => {
            channel.send({
                content: "There has been an error creating your ticket."
            });
            console.log(err);
        });
    });
}

async function generateInvoice(interaction: any, amount: number) {
    let link: string | string[];
    const client = interaction.guild?.members.cache.find((u: any) => u.id === '264609297227448331');
    const userData = await freelancer.findOne({ user: '264609297227448331' }) || new freelancer({ user: '264609297227448331' });

    // const model = await ticket.findOne({ channelID: interaction.channel.id });
    // const client = interaction.guild?.members.cache.find((u: any) => u.id === model.user);

    paypal.configure({
        "mode": config.paypal.PPMode,
        "client_id": config.paypal.PPcID,
        "client_secret": config.paypal.PPSecret
    });

    const create_invoice_json = {
        "merchant_info": {
            "business_name": "Mixelate LLC"
        },
        "items": [{
            "name": `Order for ${client.user.tag}`,
            "quantity": 1.0,
            "description": `Commission for ${client.user.tag} (${client.id}) in ${interaction.channel.name} (${interaction.channel.id})`,
            "unit_price": {
                "currency": "USD",
                "value": amount
            }
        }],
        "custom": {
            "label": "Processing Fees",
            "amount": {
                "currency": "USD",
                "value": (amount * 0.1)
            }
        },
        "note": config.paypal.productNotes,
        "terms": config.paypal.productDescription,
        "logo_url": "https://i.imgur.com/fwHqZsM.png",
        "tax_inclusive": false,
        "total_amount": {
            "currency": "USD",
            "value": amount
        },
    };

    await interaction.reply({
        content: "Generating invoice...",
        ephemeral: true
    });
    paypal.invoice.create(create_invoice_json, async function (error: any, invoice: any) {
        if (error) {
            console.log(error);
            interaction.channel.send({
                content: "There was an error while generating your invoice!"
            });
        } else {
            paypal.invoice.send(invoice.id, async function (error: any, rv: any) {
                if (error) {
                    console.log(error);
                    interaction.channel.send({
                        content: "There was an error while generating your invoice!"
                    });
                } else {
                    for (let i = 0; i < invoice.links.length; i++) {
                        if (invoice.links[i].rel === "send") {
                            link = invoice.links[i].href;
                            link = link.slice(12, link.indexOf('.com'));

                            const button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(`https://${link}.com/invoice/payerView/details/${invoice.id}`)
                                        .setLabel(`Pay with PayPal (${(amount * 1.1).toFixed(2)})`),
                                    new ButtonBuilder()
                                        .setStyle(ButtonStyle.Success)
                                        .setCustomId(`invoice-balance-${client.id}`)
                                        .setLabel(`Pay with Balance (0% fee)`)
                                        .setEmoji(`💰`)
                                        .setDisabled(userData.availableBalance < (amount * 1.1)))
                            let embed = new EmbedBuilder()
                                .setTitle("Invoice")
                                .addFields({
                                    name: "Amount",
                                    value: `$${amount.toFixed(2)}`,
                                    inline: true
                                }, {
                                    name: "Handling Fee (10%)",
                                    value: `$${(amount * .1).toFixed(2)}`,
                                    inline: true
                                }, {
                                    name: "Total",
                                    value: `$${(amount * 1.1).toFixed(2)} USD`
                                }, {
                                    name: "Status",
                                    value: `❌ Unpaid (0/${(amount * 1.1).toFixed(2)})`
                                })
                                .setColor(config.embedColor)
                                .setFooter({ text: "Mixelate | Terms of Service Apply" })
                                .setTimestamp()

                            interaction.channel.send({
                                embeds: [embed],
                                components: [button]
                            });
                        }
                    }
                    let invoiceCheck = setInterval(async () => {
                        paypal.invoice.get(invoice.id, async function (error: any, invoice: { status: string; id: any; }) {
                            if (error) {
                                console.log(error);
                                interaction.reply({
                                    content: "There was an error while verifying payment of your invoice!"
                                });
                            } else {
                                if (invoice.status === "PAID") {
                                    const paidEmbed = new EmbedBuilder()
                                        .setTitle("Invoice")
                                        .addFields({
                                            name: "Amount",
                                            value: `$${amount.toFixed(2)}`,
                                            inline: true
                                        }, {
                                            name: "Handling Fee (10%)",
                                            value: `$${(amount * .1).toFixed(2)}`,
                                            inline: true
                                        }, {
                                            name: "Total",
                                            value: `$${(amount * 1.1).toFixed(2)} USD`
                                        }, {
                                            name: "Status",
                                            value: `✅ Paid (${(amount * 1.1).toFixed(2)}/${(amount * 1.1).toFixed(2)})`
                                        })
                                        .setColor(config.embedColor)
                                        .setFooter({ text: "Mixelate | Terms of Service Apply" })
                                        .setTimestamp()

                                    clearInterval(invoiceCheck);
                                    interaction.channel.send({
                                        embeds: [paidEmbed],
                                        components: []
                                    }).then((msg: any) => {
                                        msg.pin();
                                    });

                                    const clientRole = interaction.guild.roles.cache.find((r: any) => r.id === config.roles.client);
                                    client.roles.add(clientRole);
                                }
                            }
                        });
                    }, 60000);
                }
            });
        }
    });
}

module.exports = {
    hasRoles: hasRoles,
    isTicket: isTicket,
    printRoles: printRoles,
    startOrder: startOrder,
    startApplication: startApplication,
    requestSupport: requestSupport,
    generateInvoice: generateInvoice
}