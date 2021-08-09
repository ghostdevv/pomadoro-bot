import 'dotenv/config';
import { Client, Intents } from 'discord.js';
import { JellyCommands } from 'jellycommands';
import { resolve } from 'path';

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const jelly = new JellyCommands(client);

jelly.slashCommands.load('src/slashCommands');

client.on('ready', () => {
    console.log('Online');
    jelly.slashCommands.register();
});

client.login(process.env.TOKEN);

import flatCache from 'flat-cache';

const cache = flatCache.load('focus-interval', resolve('./focus-interval'));

const add = (time, channel, guild) => {
    const ending = Date.now() + time;

    cache.setKey(Date.now(), { channel, ending, guild });
    cache.save();
};

client.addFocus = add;

setInterval(async () => {
    const keys = Object.values(cache.all());

    if (keys.length) {
        for (const { channel: channelID, ending, guild: guildID } of keys) {
            if (ending <= Date.now()) {
                const guild = await client.guilds.fetch(guildID);
                const channel = await guild.channels.fetch(channelID);

                channel.permissionOverwrites.set([
                    {
                        id: guildID,
                        allow: ['SPEAK'],
                    },
                ]);
            }
        }
    }
}, 5000);
