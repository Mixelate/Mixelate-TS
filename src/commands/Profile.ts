import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

const freelancerSchema = require('../schemas/freelancer');
const helper = require('../utils/helper'),
    config = require("../config/config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("View a freelancers profile.")
        .addSubcommand(option =>
            option.setName("set")
                .setDescription("Set profile")
                .addStringOption(option =>
                    option.setName("section")
                        .setDescription("What section of your profile would you like to update?")
                        .setRequired(true)
                        .addChoices({
                            name: "About Me",
                            value: "about"
                        }, {
                            name: "Portfolio",
                            value: "portfolio"
                        }, {
                            name: "Timezone",
                            value: "timezone"
                        }, {
                            name: "PayPal Email",
                            value: "email"
                        }, {
                            name: "PayPal.Me Link",
                            value: "paypal"
                        }, {
                            name: "Pronouns",
                            value: "pronouns"
                        }))
                .addStringOption(option =>
                    option.setName("value")
                        .setDescription("Section value")
                        .setRequired(true)
                ))
        .addSubcommand(option =>
            option.setName("view")
                .setDescription("View a users profile.")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("user")
                )),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction: ChatInputCommandInteraction, args: any) {
        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case "set": {
                const section = interaction.options.getString('section');
                const value = interaction.options.getString('value');
                const user = interaction.user;

                const member = interaction.guild?.members.cache.find(u => u.id === user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.freelancer)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: `Only freelancers may use this command!`, iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });

                const userData = await freelancerSchema.findOne({ user: user?.id }) || new freelancerSchema({ user: user?.id });
                switch (section) {
                    case "timezone": {
                        userData.timezone = value;
                        await userData.save();
                    }
                        break;
                    case "portfolio": {
                        userData.portfolio = value;
                        await userData.save();
                    }
                        break;
                    case "email": {
                        userData.email = value;
                        await userData.save();
                    }
                        break;
                    case "paypal": {
                        userData.paypal = value;
                        await userData.save();
                    }
                        break;
                    case "about": {
                        userData.about = value;
                        await userData.save();
                    }
                        break;
                    case "pronouns": {
                        userData.pronouns = value;
                        await userData.save();
                    }
                        break;
                    default: {
                        return interaction.reply({
                            embeds: [new EmbedBuilder()
                                .setColor(config.errorColor)
                                .setAuthor({ name: "Cannot find a freelancer with that ID!", iconURL: `${interaction.guild?.iconURL()}` })],
                            ephemeral: true
                        });
                    }
                }
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setAuthor({ name: `${user.username}'s Profile`, iconURL: `${interaction.guild?.iconURL()}` })
                        .setDescription(`Your **${section}** has been updated to: \`\`\`${value}\`\`\``)
                        .setFooter({ text: `Mixelate | ${user.id}` })],
                    ephemeral: true
                });
            }
                break;
            case "view": {
                const user = interaction.options.getUser("user") || interaction.user;
                const userData = await freelancerSchema.findOne({ user: user?.id }) || new freelancerSchema({ user: user?.id });

                const member = interaction.guild?.members.cache.find(u => u.id === user.id);
                if (!member?.roles.cache.find(role => role.id === config.roles.freelancer)) return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.errorColor)
                        .setAuthor({ name: "The selected user is not a freelancer.", iconURL: `${interaction.guild?.iconURL()}` })],
                    ephemeral: true
                });
                const profileEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${user.username}'s Profile`, iconURL: `${interaction.guild?.iconURL()}` })
                    .setColor(config.embedColor)
                    .setDescription(`\`\`\`${userData.about}\`\`\``)
                    .addFields({
                        name: 'Portfolio',
                        value: `${userData.portfolio}`,
                        inline: true
                    }, {
                        name: 'Timezone',
                        value: `${userData.timezone}`,
                        inline: true
                    }, {
                        name: 'Fulfilled Commissions',
                        value: `${userData.claims}`
                    }, {
                        name: 'Rating',
                        value: `${userData.rating}`,
                        inline: true
                    })
                    .setThumbnail(user.avatarURL())
                    .setFooter({ text: `Mixelate | ${user.id}` })
                return interaction.reply({
                    embeds: [profileEmbed],
                    ephemeral: true
                });
            }
                break;
        }
    }
}