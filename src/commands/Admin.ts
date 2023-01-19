import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

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
    execute(interaction: ChatInputCommandInteraction) {
        interaction.reply({
            content: "Pong!",
            ephemeral: true
        });
        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case "strip": {

            }
                break;
            case "wallet": {

            }
                break;
        }
    }
};