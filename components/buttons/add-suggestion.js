const {
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ComponentType,
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	bold,
	inlineCode,
	codeBlock,
	channelMention,
	userMention,
} = require("discord.js");
require("dotenv").config();

const servers = require("../../utils/servers");
const localization = require("../../utils/localization");

module.exports = {
	cooldown: 10,
	data: {
		name: "add-suggestion",
	},
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const guildId = interaction.guildId;

		const voteSuggestionChannel = servers[guildId].vote;
		const localized = JSON.parse(
			JSON.stringify(localization).replaceAll(
				"{{voteSuggestionChannel}}",
				channelMention(voteSuggestionChannel)
			)
		);

		const channel = await interaction.client.channels.fetch(
			voteSuggestionChannel
		);
		const availableTags = channel.availableTags;

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("suggestion-category")
			.setPlaceholder(
				localized.select_suggestion_category[interaction.locale] ??
					localized.select_suggestion_category["en-US"]
			);

		for (const tag of availableTags) {
			selectMenu.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(tag.name)
					.setValue(tag.name)
			);
		}

		const row = new ActionRowBuilder().addComponents(selectMenu);

		const modal = new ModalBuilder().setCustomId("suggestion-modal");

		const modalRow1 = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId("title")
				.setLabel(
					localized.title[interaction.locale] ??
						localized.title["en-US"]
				)
				.setStyle(TextInputStyle.Short)
				.setPlaceholder(
					localized.give_title[interaction.locale] ??
						localized.give_title["en-US"]
				)
		);
		const modalRow2 = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId("rid")
				.setLabel(
					localized.rid[interaction.locale] ?? localized.rid["en-US"]
				)
				.setStyle(TextInputStyle.Short)
				.setPlaceholder(
					localized.give_rid[interaction.locale] ??
						localized.give_rid["en-US"]
				)
		);
		const modalRow3 = new ActionRowBuilder().addComponents(
			new TextInputBuilder()
				.setCustomId("description")
				.setLabel(
					localized.description[interaction.locale] ??
						localized.description["en-US"]
				)
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder(
					localized.give_description[interaction.locale] ??
						localized.give_description["en-US"]
				)
		);

		modal.addComponents(modalRow1, modalRow2, modalRow3);

		await interaction.editReply({
			content: bold(
				localized.suggestion_category[interaction.locale] ??
					localized.suggestion_category["en-US"]
			),
			components: [row],
		});

		const botReply = await interaction.fetchReply();

		const collector = botReply.createMessageComponentCollector({
			time: 10_000,
			componentType: ComponentType.StringSelect,
		});

		collector.on("collect", async (selectMenuInteraction) => {
			const category = selectMenuInteraction.values[0];
			modal.setTitle(category);

			await interaction.editReply({
				content:
					userMention(selectMenuInteraction.user.id) +
					(localized.selected[interaction.locale] ??
						localized.selected["en-US"]) +
					inlineCode(category),
				components: [],
			});

			await selectMenuInteraction.showModal(modal);

			const modalReply = await selectMenuInteraction
				.awaitModalSubmit({
					time: 60_000,
					filter: (modalInteraction) =>
						modalInteraction.user.id ===
						selectMenuInteraction.user.id,
				})
				.catch(() => {
					interaction.editReply({
						content:
							localized.form_expired[interaction.locale] ??
							localized.form_expired["en-US"],
						components: [],
					});
					setTimeout(() => interaction.deleteReply(), 10_000);
					return null;
				});

			if (!modalReply) return;

			await modalReply.reply({
				content: bold(modal.data.title),
				ephemeral: true,
			});

			await modalReply.deleteReply();

			await interaction.editReply({
				content:
					(localized.suggestion_submitted[interaction.locale] ??
						localized.suggestion_submitted["en-US"]) +
					"\n\n" +
					bold(modal.data.title) +
					"\n" +
					codeBlock(
						modalReply.fields.getTextInputValue("description")
							.length < 2000
							? modalReply.fields.getTextInputValue("description")
							: modalReply.fields
									.getTextInputValue("description")
									.slice(0, 1000) + "..."
					),
			});

			collector.stop();

			await sendSuggestionAdmin(modalReply, modal.data.title);
		});

		collector.on("end", (collected, reason) => {
			if (reason === "time" && !collected.size) {
				interaction.editReply({
					content:
						localized.form_expired[interaction.locale] ??
						localized.form_expired["en-US"],
					components: [],
				});
				setTimeout(() => interaction.deleteReply(), 10_000);
			}
		});
	},
};

async function sendSuggestionAdmin(interaction, category) {
	const user = interaction.user;
	const title = interaction.fields.getTextInputValue("title");
	const description = interaction.fields.getTextInputValue("description");
	const rid = interaction.fields.getTextInputValue("rid");
	const guildId = interaction.guildId;

	const embed = new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.addFields(
			{
				name:
					localization.category[interaction.locale] ??
					localization.category["en-US"],
				value: category,
				inline: true,
			},
			{ name: "RID", value: rid, inline: true }
		)
		.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
		.setFooter({ text: user.id + "-" + rid })
		.setColor(process.env.EMBED_COLOR);

	const approveButton = new ButtonBuilder()
		.setCustomId("approve-suggestion")
		.setLabel(
			localization.approve[interaction.locale] ??
				localization.approve["en-US"]
		)
		.setStyle(ButtonStyle.Success);

	const denyButton = new ButtonBuilder()
		.setCustomId("deny-suggestion")
		.setLabel(
			localization.deny[interaction.locale] ?? localization.deny["en-US"]
		)
		.setStyle(ButtonStyle.Danger);

	const row = new ActionRowBuilder().addComponents(approveButton, denyButton);

	const channel = await interaction.client.channels.fetch(
		servers[guildId].decide
	);
	await channel.send({ embeds: [embed], components: [row] });
}
