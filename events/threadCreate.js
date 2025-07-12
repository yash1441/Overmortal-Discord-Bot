const { Events, ChannelType } = require("discord.js");
const lark = require("../utils/lark.js");
require("dotenv").config();
const servers = require("../utils/servers");

module.exports = {
	name: Events.ThreadCreate,
	async execute(thread) {
		const guildId = thread.guildId;
		if (
			thread.parent.type != ChannelType.GuildForum ||
			thread.parentId != servers[guildId].vote
		)
			return;

		const message = await thread.fetchStarterMessage();
		const embed = await message.embeds[0];
		const discordId = embed.data.footer.text.split("-", 2)[0];
		const rid = embed.data.footer.text.split("-", 2)[1];

		if (!embed) return;

		await message.react("✅").then(message.react("❌"));

		const tag = thread.parent.availableTags.find(
			(tag) => tag.id == thread.appliedTags[0]
		);

		const data = {
			Title: thread.name,
			Details: embed.data.description,
			Category: tag.name,
			"✅": 0,
			"❌": 0,
			"Discord ID": discordId,
			//"Discord Name": embed.data.author.name,
			"Server ID": guildId,
			RID: rid,
		};

		const base =
			guildId === "1215600132003725353"
				? servers[guildId].base
				: process.env.FEEDBACK_POOL_BASE;
		const table =
			guildId === "1215600132003725353"
				? servers[guildId].discord_feedback
				: process.env.SUGGESTIONS_TABLE;

		const success = await lark.createRecord(base, table, { fields: data });
		if (!success) console.log("Failed to create record in lark");
	},
};
