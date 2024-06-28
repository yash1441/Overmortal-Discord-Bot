const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, bold, inlineCode } = require('discord.js');
require('dotenv').config();
const { contentSubmission } = require('../../utils/creator');

module.exports = {
    cooldown: 60,
    data: {
        name: 'youtube-shorts',
    },
    async execute(interaction) {
        await contentSubmission(interaction, 'YouTube Shorts');
    },
};