const { contentSubmission } = require('../../utils/creator');

module.exports = {
    cooldown: 60,
    data: {
        name: 'twitch',
    },
    async execute(interaction) {
        await contentSubmission(interaction, 'Twitch');
    },
};