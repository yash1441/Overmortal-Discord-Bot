const { Events, ActivityType } = require('discord.js');
const cronjobs = require('../utils/cronjobs');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		client.user.setPresence({
			activities: [
				{
					name: 'Overmortal',
					type: ActivityType.Playing,
					state: "Overmortal"
				},
			],
			status: 'online'
		});

		cronjobs.dailyCron(client);
	},
};