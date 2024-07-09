const { contentSubmission } = require("../../utils/creator");

module.exports = {
	cooldown: 60,
	data: {
		name: "x",
	},
	async execute(interaction) {
		await contentSubmission(interaction, "X");
	},
};
