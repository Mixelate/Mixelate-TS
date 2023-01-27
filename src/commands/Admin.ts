import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";

const warnSchema = require("../schemas/warns");
const config = require("../config/config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Default Description")
        .addSubcommand(option =>
            option.setName("warn")
                .setDescription("Warn a user with a reason.")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Who would you like to warn?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("What is the reasoning for this warn?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("warns")
                .setDescription("Displays the warns of a user and the reasons.")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Which users warns would you like to view?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("strip")
                .setDescription("Strip a user of all freelancer roles.")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Who would like to strip the freelancer roles from?")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("What is the reasoning for stripping this user of all roles?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("role")
                .setDescription("Add or remove a role from a user.")
                .addStringOption(option =>
                    option.setName("option")
                        .setDescription("Would you like to add or remove a role?")
                        .setRequired(true)
                        .addChoices({
                            name: "Add Role",
                            value: "add"
                        }, {
                            name: "Remove Role",
                            value: "remove"
                        }))
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Who would you like to add or remove a role from?")
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Which role would you like to add or remove?")
                        .setRequired(true)))
        .addSubcommand(option =>
            option.setName("wallet")
                .setDescription("GUI with Earnings and Balance information of a user.")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("Which user's wallet would you like to view?")
                        .setRequired(true))),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction: ChatInputCommandInteraction) {
        const subCommand = interaction.options.getSubcommand();

        switch (subCommand) {
            case "role": {
                // fetch options from the command
                const option = interaction.options.getString("option");
                const user = interaction.options.getUser("user");
                const role = interaction.options.getRole("role");
                // find specified user in guild
                const member = interaction.guild?.members.cache.find(u => u.id === user?.id);

                switch (option) {
                    case "add": {
                        // check if user already has specified role
                        if (member?.roles.cache.find(r => r.id === role?.id)) {
                            return interaction.reply({
                                embeds: [new EmbedBuilder()
                                    .setAuthor({ name: `${user?.tag} already has that specified role!` })
                                    .setColor(config.errorColor)],
                                ephemeral: true
                            });
                        }
                        // @ts-ignore
                        member?.roles.add(role).then(() => {
                            return interaction.reply({
                                embeds: [new EmbedBuilder()
                                    .setTitle("Mixelate | Moderation")
                                    .setDescription(`Added ${role} to ${user?.toString()}`)
                                    .setColor(config.embedColor)],
                                ephemeral: true
                            });
                        }).catch(err => {
                            console.log(err);
                        });
                    }
                        break;
                    case "remove": {
                        // check if user doesn't have specified role
                        if (!member?.roles.cache.find(r => r.id === role?.id)) {
                            return interaction.reply({
                                embeds: [new EmbedBuilder()
                                    .setAuthor({ name: `${user?.tag} does not have that specified role!` })
                                    .setColor(config.errorColor)],
                                ephemeral: true
                            });
                        }
                        // @ts-ignore
                        member?.roles.remove(role).then(() => {
                            return interaction.reply({
                                embeds: [new EmbedBuilder()
                                    .setTitle("Mixelate | Moderation")
                                    .setDescription(`Removed ${role} from ${user?.toString()}`)
                                    .setColor(config.embedColor)],
                                ephemeral: true
                            });
                        }).catch(err => {
                            console.log(err);
                        });
                    }
                        break;
                }
            }
                break;
            case "warn": {
                const user = interaction.options.getUser("user");
                const reason = interaction.options.getString("reason");
                const warnData = await warnSchema.findOne({ user: user?.id }) || new warnSchema({ user: user?.id });
                // store new data
                warnData.amount += 1;
                warnData.reasons.push({ number: `${warnData.amount}`, text: reason, by: `${interaction.user.tag}` });
                await warnData.save();
                // return reply to user
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle("Mixelate | Moderation")
                        .setDescription(`${user?.toString()} has been warned for: \`\`\`${reason}\`\`\``)
                        .setFooter({ text: `User now has ${warnData.amount} warns` })],
                    ephemeral: true
                });
            }
                break;
            case "warns": {
                const user = interaction.options.getUser("user");
                const warnData = await warnSchema.findOne({ user: user?.id }) || new warnSchema({ user: user?.id });

                const warnEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${user?.username}'s Warns`, iconURL: `${interaction.guild?.iconURL()}` })
                    // .setDescription(`${reasonsArray.split(',')}`)
                    .setColor(config.embedColor)
                    .setFooter({ text: `${user?.tag} has ${warnData.amount} warns` })
                warnData.reasons.forEach((element: any) => {
                    warnEmbed.addFields({
                        name: `${element.number}.`,
                        value: `\`\`\`Warned by: ${element.by}\nReason: ${element.text}\`\`\``
                    });
                });

                interaction.reply({
                    embeds: [warnEmbed],
                    ephemeral: true
                });
            }
                break;
            case "strip": {
                const user = interaction.options.getUser("user");
                const reason = interaction.options.getString("reason");

                const member = interaction.guild?.members.cache.find(u => u.id === user?.id);
                if (!member?.roles.cache.find(r => r.id === config.roles.freelancer)) return interaction.reply({ content: "This user is not a freelancer.", ephemeral: true });
                const role = interaction.guild?.roles.cache.find(r => r.id === config.roles.freelancer);

                // @ts-ignore
                member.roles.remove(role).then(() => {
                    member.roles.remove(config.roles.departments).then(() => {
                        return interaction.reply({
                            embeds: [new EmbedBuilder().setColor(config.embedColor).setTitle("Mixelate Moderation").setDescription(`Stripped ${user?.toString()} of all freelancing roles for:\`\`\`${reason}\`\`\``).setFooter({ text: `Executed by ${interaction.user.tag}`})],
                            ephemeral: true
                        });
                    });
                }).catch(err => {
                    console.log(err);
                });
            }
                break;
            case "wallet": {

            }
                break;
        }
    }
};