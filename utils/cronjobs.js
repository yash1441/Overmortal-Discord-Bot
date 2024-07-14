const cron = require("node-cron");
require("dotenv").config();
const lark = require("./lark");
const servers = require("./servers.json");

async function giveCreatorRoles(client) {
	cron.schedule(
		"0 0 * * *",
		async () => {
			console.log("Running daily cron job - Creator Roles");

			const records = await lark.listRecords(
				process.env.CREATOR_BASE,
				process.env.APPLICATION_TABLE,
				{ filter: `CurrentValue.[Status] = "Accepted"` }
			);

			if (!records || !records.total) return;

			for (const record of records.items) {
				const guildInRegion = Object.entries(servers).find(
					([serverId, serverData]) =>
						serverData.region === record.fields.Region
				);
				const [guildId, guildData] = guildInRegion;
				const guild = await client.guilds.fetch(guildId);
				const role = servers[guildId].creator;
				guild.members
					.fetch(record.fields["Discord ID"])
					.then(async (member) => {
						await member.roles
							.add(role)
							.then(
								console.log(
									"Added creator role to ",
									record.fields["Discord Name"]
								)
							)
							.catch(console.error);
					})
					.catch(console.error);

				const success = await lark.updateRecord(
					process.env.CREATOR_BASE,
					process.env.APPLICATION_TABLE,
					record.record_id,
					{
						fields: {
							Status: "Role Given",
						},
					}
				);

				if (!success) return console.log("Failed to update record");
			}
		},
		{
			timezone: "Asia/Singapore",
		}
	);
}

module.exports = { giveCreatorRoles };
