const { contentSubmission } = require("../../utils/creator");

module.exports = {
	cooldown: 60,
	data: {
		name: "youtube",
	},
	async execute(interaction) {
		await contentSubmission(interaction, "YouTube");
	},
};
