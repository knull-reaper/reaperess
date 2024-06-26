module.exports = {
    name: 'leave',
    aliases: ['stop'],
    description: 'Leave current voice channel',
    usage: 'leave',
    voiceChannel: true,
    options: [],

    execute(client, message) {
        const queue = client.player.getQueue(message.guild.id);

        if (!queue || !queue.playing)
            return message.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        queue.destroy();
        return message.react('❤');
    },

    slashExecute(client, interaction) {
        const queue = client.player.getQueue(interaction.guild.id);

        if (!queue || !queue.playing)
            return interaction.reply({ content: `❌ | There is no music currently playing.`, allowedMentions: { repliedUser: false } });

        queue.destroy();
        return interaction.reply('✅ | Bot leave.');
    },
};