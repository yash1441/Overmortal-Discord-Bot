const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, bold, codeBlock } = require('discord.js');
require('dotenv').config();

const servers = require('../../utils/servers');
const localization = require('../../utils/localization');

module.exports = {
    cooldown: 10,
    data: {
        name: 'submit-content',
    },
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guildId;
        const submissionData = {
            guildId: guildId,
            userId: interaction.user.id,
        };

        const platformSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('submission-platform')
            .setPlaceholder(localization.select_platform[interaction.locale] ?? localization.select_platform["en-US"])
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('YouTube')
                    .setValue('YouTube'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('YouTube Shorts')
                    .setValue('YouTube Shorts'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('TikTok')
                    .setValue('TikTok'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Twitch')
                    .setValue('Twitch')
            );

        const platformRow = new ActionRowBuilder().addComponents(platformSelectMenu);

        const submissionModal = new ModalBuilder().setCustomId('submission-modal');

        const submissionModalLink = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel((localization.channel_link[interaction.locale] ?? localization.channel_link["en-US"]).replace('{{paltform}}', submissionData.platform)).setStyle(TextInputStyle.Short));
        const submissionModalTheme = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('theme').setLabel(localization.video_theme[interaction.locale] ?? localization.video_theme["en-US"]).setStyle(TextInputStyle.Short));

        submissionModal.addComponents(submissionModalLink, submissionModalTheme);

        await interaction.editReply({
            content: bold(localization.select_submission_platform[interaction.locale] ?? localization.select_submission_platform["en-US"]),
            components: [platformRow]
        });
        const botReply = {};
        botReply.platformReply = await interaction.fetchReply();

        const platformCollector = botReply.platformReply.createMessageComponentCollector({
            time: 10_000,
            componentType: ComponentType.StringSelect
        });

        platformCollector.on('collect', async (platformInteraction) => {
            submissionData.platform = platformInteraction.values[0];
            await platformInteraction.reply({
                content: bold(localization.platform[platformInteraction.locale] ?? localization.platform["en-US"]) + ' ' + submissionData.platform,
                ephemeral: true
            });
            botReply.topicReply = await platformInteraction.fetchReply();

            platformCollector.stop();

            const topicSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('submission-topic')
                .setPlaceholder(localization.select_topic[interaction.locale] ?? localization.select_topic["en-US"])
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(localization.meme[interaction.locale] ?? localization.meme["en-US"])
                        .setValue('meme'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel(localization.other[interaction.locale] ?? localization.other["en-US"])
                        .setValue('other')
                );

            const topicRow = new ActionRowBuilder().addComponents(topicSelectMenu);
            await interaction.editReply({
                content: bold(localization.select_submission_topic[interaction.locale] ?? localization.select_submission_topic["en-US"]),
                components: [topicRow]
            });
        });

        platformCollector.on('end', (collected, reason) => {
            if (reason === 'time' && !collected.size) {
                interaction.editReply({
                    content: localization.selection_expired[interaction.locale] ?? localization.selection_expired["en-US"], components: []
                });
                setTimeout(() => interaction.deleteReply(), 10_000);
            };
        });

        if (!submissionData.platform) return;

        const topicCollector = botReply.topicReply.createMessageComponentCollector({ time: 10_000, componentType: ComponentType.StringSelect });

        topicCollector.on('collect', async (topicInteraction) => {
            submissionData.topic = topicInteraction.values[0];
            submissionModal.setTitle(submissionData.topic);

            await topicInteraction.showModal(submissionModal);

            botReply.modalReply = await topicInteraction.awaitModalSubmit({
                time: 60_000,
                filter: (modalInteraction) => modalInteraction.user.id === topicInteraction.user.id
            }).catch(() => {
                interaction.editReply({
                    content: localization.form_expired[interaction.locale] ?? localization.form_expired["en-US"], components: []
                });
                setTimeout(() => interaction.deleteReply(), 10_000);
            });

            topicCollector.stop();
        });

        topicCollector.on('end', (collected, reason) => {
            if (reason === 'time' && !collected.size) {
                interaction.editReply({ content: localization.selection_expired[interaction.locale] ?? localization.selection_expired["en-US"], components: [] });
                setTimeout(() => interaction.deleteReply(), 10_000);
            };
        });

        if (!submissionData.topic || !botReply.modalReply) return;

        await botReply.modalReply.reply({ content: bold(submissionModal.data.title), ephemeral: true })

        await botReply.modalReply.deleteReply();

        await interaction.editReply({
            content: (localization.content_submitted[interaction.locale] ?? localization.content_submitted["en-US"]) + '\n\n' + bold(submissionModal.data.title) + '\n' + codeBlock(botReply.modalReply.fields.getTextInputValue('link') + '\n' + codeBlock(botReply.modalReply.fields.getTextInputValue('theme')))
        });
    },
};