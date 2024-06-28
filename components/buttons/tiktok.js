const { contentSubmission } = require('../../utils/creator');

module.exports = {
    cooldown: 60,
    data: {
        name: 'tiktok',
    },
    async execute(interaction) {
        await contentSubmission(interaction, 'TikTok');
    },
};