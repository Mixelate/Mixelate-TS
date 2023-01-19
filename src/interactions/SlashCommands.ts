import { CommandInteraction } from "discord.js";

module.exports = {
    name: "interactionCreate",
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     */
    execute(interaction: CommandInteraction, client: any) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return interaction.reply({
            content: "This command is outdated",
            ephemeral: true
        });

        if (command.developer && interaction.user.id !== "264609297227448331")
            return interaction.reply({
                content: "This command is only available to developers.",
                ephemeral: true
            });
        
        command.execute(interaction, client);
    }
}