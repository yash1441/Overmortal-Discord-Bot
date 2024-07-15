const { EmbedBuilder } = require("discord.js");
const lark = require("../../utils/lark");
require("dotenv").config();

module.exports = {
	cooldown: 10,
	data: {
		name: "check-status",
	},
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const response = await lark.listRecords(
			process.env.CREATOR_BASE,
			process.env.CREATOR_BASE,
			{
				filter:
					'CurrentValue.[Discord ID] = "' +
					interaction.user.id +
					'")',
			}
		);

		if (!response || !response.total) {
			return interaction.editReply({
				content:
					"You are either not in the creator database yet or there is some issue with the bot.",
			});
		}

		const userData = {
			discordId: interaction.user.id,
			username: interaction.user.username,
			avatar: interaction.user.displayAvatarURL(),
			region: response.items[0].fields.Region,
			benefitLevel: response.items[0].fields["Benefit Level"],
			totalViews: response.items[0].fields["Total Views"],
			totalVideos: response.items[0].fields["Total Videos"],
			totalBP: response.items[0].fields["Total BP"],
		};

		const embed = new EmbedBuilder()
			.setTitle("Creator Status")
			.setAuthor({ name: userData.username, iconURL: userData.avatar })
			.addFields(
				{
					name: "Benefit Level",
					value: userData.benefitLevel,
					inline: false,
				},
				{
					name: "Total Views",
					value: userData.totalViews,
					inline: false,
				},
				{
					name: "Total Valid Videos",
					value: userData.totalVideos,
					inline: false,
				},
				{
					name: "Total BP",
					value: userData.totalBP,
					inline: false,
				}
			)
			.setColor(process.env.EMBED_COLOR)
			.setTimestamp();

		await interaction.editReply({
			embeds: [embed],
		});
	},
};
