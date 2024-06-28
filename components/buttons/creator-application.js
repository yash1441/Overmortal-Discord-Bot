const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, bold, inlineCode, codeBlock, channelMention, userMention } = require('discord.js');
const lark = require('../../utils/lark');
require('dotenv').config();

const servers = require('../../utils/servers');
const localization = require('../../utils/localization');

module.exports = {
    cooldown: 60,
    data: {
        name: 'creator-application',
    },
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const creatorData = {
            guildId: interaction.guildId,
            userId: interaction.user.id,
            name: interaction.user.username,
            region: servers[interaction.guildId].region
        };

        const creatorModal = new ModalBuilder().setCustomId('creator-modal');

        const platformSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('creator-platform')
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
                    .setValue('Twitch'),
            );

        const row = new ActionRowBuilder().addComponents(platformSelectMenu);

        await interaction.editReply({
            content: bold(localization.select_submission_platform[interaction.locale] ?? localization.select_submission_platform["en-US"]),
            components: [row],
        });

        const platformReply = await interaction.fetchReply();

        const collector = platformReply.createMessageComponentCollector({
            time: 10_000,
            componentType: ComponentType.StringSelect
        });

        collector.on('collect', async (platformInteraction) => {
            creatorData.platform = platformInteraction.values[0];

            const creatorModalChannel = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('channel').setLabel(JSON.parse(JSON.stringify(localization).replaceAll('{{platform}}', creatorData.platform)).channel_link[interaction.locale] ?? JSON.parse(JSON.stringify(localization).replaceAll('{{platform}}', creatorData.platform)).channel_link["en-US"]).setStyle(TextInputStyle.Short));
            const creatorModalSubs = new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('subs').setLabel(localization.channel_subscribers[interaction.locale] ?? localization.channel_subscribers["en-US"]).setStyle(TextInputStyle.Short));

            creatorModal.addComponents(creatorModalChannel, creatorModalSubs);
            creatorModal.setTitle(creatorData.platform + ' Creator');

            await platformInteraction.showModal(creatorModal);

            const modalReply = await platformInteraction.awaitModalSubmit({
                time: 60_000,
                filter: (modalInteraction) => modalInteraction.user.id === platformInteraction.user.id
            }).catch(() => {
                interaction.editReply({
                    content: localization.form_expired[interaction.locale] ?? localization.form_expired["en-US"], components: []
                });
                setTimeout(() => interaction.deleteReply(), 10_000);
            });

            collector.stop();

            if (!creatorData.platform || !modalReply) return;

            await modalReply.reply({ content: bold(creatorData.platform), ephemeral: true })

            await modalReply.deleteReply();

            creatorData.channel = modalReply.fields.getTextInputValue('channel');
            creatorData.subs = modalReply.fields.getTextInputValue('subs');

            await interaction.editReply({
                content: (localization.application_submitted[interaction.locale] ?? localization.application_submitted["en-US"]) + '\nPlatform ' + inlineCode(creatorData.platform) + '\nChannel ' + inlineCode(creatorData.channel) + '\nSubscribers ' + inlineCode(creatorData.subs),
                components: []
            });

            const records = await lark.listRecords(
                process.env.CREATOR_BASE,
                process.env.APPLICATION_TABLE,
                { filter: `CurrentValue.[Discord ID] = "${creatorData.userId}"` }
            );

            if (records.total) return console.log(creatorData.name, ' already submitted.');

            const success = await lark.createRecord(
                process.env.CREATOR_BASE,
                process.env.APPLICATION_TABLE,
                {
                    "fields": {
                        "Discord ID": creatorData.userId,
                        "Discord Name": creatorData.name,
                        "Platform": creatorData.platform,
                        "Channel": {
                            link: creatorData.channel,
                            text: creatorData.channel,
                        },
                        "Region": creatorData.region,
                        "Subscribers": parseInt(creatorData.subs) ?? 0
                    }
                }
            );

            if (!success) return console.warn('Could not create record.');
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && !collected.size) {
                interaction.editReply({ content: localization.selection_expired[interaction.locale] ?? localization.selection_expired["en-US"], components: [] });
                setTimeout(() => interaction.deleteReply(), 10_000);
            };
        });
    },
};