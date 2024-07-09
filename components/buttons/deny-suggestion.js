const { EmbedBuilder, userMention } = require("discord.js");
require("dotenv").config();
const localization = require("../../utils/localization");

module.exports = {
	cooldown: 10,
	data: {
		name: "deny-suggestion",
	},
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const embed = interaction.message.embeds[0];

		const deniedEmbed = EmbedBuilder.from(embed)
			.setColor(process.env.EMBED_COLOR_DENIED)
			.addFields({
				name:
					localization.decision[interaction.locale] ??
					localization.decision["en-US"],
				value: userMention(interaction.user.id),
				inline: true,
			});

		await interaction.message
			.edit({ embeds: [deniedEmbed], components: [] })
			.then(() => interaction.deleteReply());
	},
};
