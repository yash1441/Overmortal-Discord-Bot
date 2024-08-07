const {
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	bold,
	inlineCode,
} = require("discord.js");
require("dotenv").config();

const lark = require("./lark");
const localization = require("./localization");

async function contentSubmission(interaction, platform) {
	await interaction.deferReply({ ephemeral: true });

	const submissionData = {
		guildId: interaction.guildId,
		userId: interaction.user.id,
		name: interaction.user.username,
		platform: platform,
	};

	const localized = JSON.parse(
		JSON.stringify(localization).replaceAll(
			"{{platform}}",
			submissionData.platform
		)
	);

	const submissionModal = new ModalBuilder().setCustomId("submission-modal");

	const submissionModalLink = new ActionRowBuilder().addComponents(
		new TextInputBuilder()
			.setCustomId("link")
			.setLabel(
				localized.video_link[interaction.locale] ??
					localized.video_link["en-US"]
			)
			.setStyle(TextInputStyle.Short)
	);
	const submissionModalTheme = new ActionRowBuilder().addComponents(
		new TextInputBuilder()
			.setCustomId("theme")
			.setLabel(
				localization.video_theme[interaction.locale] ??
					localization.video_theme["en-US"]
			)
			.setStyle(TextInputStyle.Short)
	);

	submissionModal.addComponents(submissionModalLink, submissionModalTheme);

	const topicSelectMenu = new StringSelectMenuBuilder()
		.setCustomId("submission-topic")
		.setPlaceholder(
			localization.select_topic[interaction.locale] ??
				localization.select_topic["en-US"]
		)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(
					localization.meme[interaction.locale] ??
						localization.meme["en-US"]
				)
				.setValue("Meme"),
			new StringSelectMenuOptionBuilder()
				.setLabel(
					localization.other[interaction.locale] ??
						localization.other["en-US"]
				)
				.setValue("Other")
		);

	const topicRow = new ActionRowBuilder().addComponents(topicSelectMenu);

	await interaction.editReply({
		content: bold(
			localization.select_submission_topic[interaction.locale] ??
				localization.select_submission_topic["en-US"]
		),
		components: [topicRow],
	});
	const botReply = await interaction.fetchReply();

	const collector = botReply.createMessageComponentCollector({
		time: 10_000,
		componentType: ComponentType.StringSelect,
	});

	collector.on("collect", async (topicInteraction) => {
		submissionData.topic = topicInteraction.values[0];
		submissionModal.setTitle(submissionData.topic);

		await topicInteraction.showModal(submissionModal);

		botReply.modalReply = await topicInteraction
			.awaitModalSubmit({
				time: 60_000,
				filter: (modalInteraction) =>
					modalInteraction.user.id === topicInteraction.user.id,
			})
			.catch(() => {
				interaction.editReply({
					content:
						localization.form_expired[interaction.locale] ??
						localization.form_expired["en-US"],
					components: [],
				});
				setTimeout(() => interaction.deleteReply(), 10_000);
			});

		collector.stop();

		if (!submissionData.topic || !botReply.modalReply) return;

		await botReply.modalReply.reply({
			content: bold(submissionData.topic),
			ephemeral: true,
		});

		await botReply.modalReply.deleteReply();

		submissionData.link =
			botReply.modalReply.fields.getTextInputValue("link");
		submissionData.theme =
			botReply.modalReply.fields.getTextInputValue("theme");

		await interaction.editReply({
			content:
				(localization.content_submitted[interaction.locale] ??
					localization.content_submitted["en-US"]) +
				"\nTopic " +
				inlineCode(submissionData.topic) +
				"\nLink " +
				inlineCode(submissionData.link) +
				"\nTheme " +
				inlineCode(submissionData.theme),
			components: [],
		});

		const records = await lark.listRecords(
			process.env.CREATOR_BASE,
			process.env.SUBMISSION_TABLE,
			{
				filter:
					'CurrentValue.[Video].contains("' +
					submissionData.link +
					'")',
			}
		);

		if (records.total)
			return console.log(submissionData.link, " already submitted.");

		const success = await lark.createRecord(
			process.env.CREATOR_BASE,
			process.env.SUBMISSION_TABLE,
			{
				fields: {
					"Discord ID": submissionData.userId,
					"Discord Name": submissionData.name,
					Platform: submissionData.platform,
					Video: {
						link: submissionData.link,
						text: submissionData.theme,
					},
					Topic: submissionData.topic,
				},
			}
		);

		if (!success) return console.warn("Could not create record.");
	});

	collector.on("end", (collected, reason) => {
		if (reason === "time" && !collected.size) {
			interaction.editReply({
				content:
					localization.selection_expired[interaction.locale] ??
					localization.selection_expired["en-US"],
				components: [],
			});
			setTimeout(() => interaction.deleteReply(), 10_000);
		}
	});
}

module.exports = { contentSubmission };
