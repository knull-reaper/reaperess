const embed = require('../embeds/embeds');


module.exports = {
    name: 'invite',
    aliases: ['inv'],
    description: 'Invite Me',
    usage: 'invite',
    options: [],

    execute(client, message) {
        message.reply({ embeds: [embed.Embed_invite()], allowedMentions: { repliedUser: false } });
    },

    slashExecute(client, interaction) {
        interaction.reply({ embeds: [embed.Embed_invite()], allowedMentions: { repliedUser: false } });
    },
};
