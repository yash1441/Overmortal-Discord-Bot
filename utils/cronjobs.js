const cron = require('node-cron');
require('dotenv').config();
const lark = require('./lark')
const servers = require('./servers.json');

async function dailyCron(client) {
    // cron.schedule("0 0 * * *", async () => {
        console.log("Running daily cron job");

        const records = await lark.listRecords(
            process.env.CREATOR_BASE,
            process.env.APPLICATION_TABLE,
            { filter: `CurrentValue.[Status] = "Accepted"` }
        );

        if (!records || !records.total) return console.log('0 records modified');

        for (const record of records.items) {
            const guildInRegion = Object.entries(servers).find(([serverId, serverData]) => serverData.region === record.fields.Region);
            const [guildId, guildData] = guildInRegion;
            const guild = await client.guilds.fetch(guildId);
            const role = servers[guildId].creator;
            guild.members.fetch(record.fields['Discord ID'])
                .then(async (member) => {
                    await member.roles.add(role)
                        .then(console.log('Added creator role to ', record.fields['Discord Name']))
                        .catch(console.log('Failed to add creator role to ', record.fields['Discord Name']))
                })
                .catch(console.log('Failed to fetch member ', record.fields['Discord Name']));

            const success = await lark.updateRecord(
                process.env.CREATOR_BASE,
                process.env.APPLICATION_TABLE,
                record.record_id,
                {
                    "Status": "Role Given",
                }
            );

            if (!success) return console.log('Failed to update record')
        }

        console.log(records);
    // },
    //     {
    //         timezone: "Asia/Singapore",
    //     }
    // );
}

module.exports = { dailyCron };