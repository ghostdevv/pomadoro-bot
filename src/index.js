import 'dotenv/config';
import { Client, Intents } from 'discord.js';
import { JellyCommands } from 'jellycommands';
import flatCache from 'flat-cache';
import { resolve } from 'path';

const cache = flatCache.load('focus-interval', resolve('./focus-interval'));
const getCacheValues = () => Object.values(cache.all());

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});

const jelly = new JellyCommands(client);

jelly.slashCommands.load('src/slashCommands');

client.on('ready', () => {
    console.log('Online');
    jelly.slashCommands.register();
});

client.on('voiceStateUpdate', (old, state) => {
    const isFocus = (channelId) =>
        !!getCacheValues().find(({ channel }) => channel == channelId);

    const joined = !old.channel && state.channel;
    const moved =
        old.channelId != state.channelId && old.channelId && state.channelId;

    if (!(joined || moved)) return;

    const focus = isFocus(state.channelId);
    state.member.voice.setMute(focus);

    if (focus) {
        try {
            state.member.send({
                embeds: [
                    {
                        description:
                            'You joined a channel in focus mode, so you are muted until it ends',
                        color: 'RANDOM',
                    },
                ],
            });
        } catch (e) {
            console.log(`Unable to dm ${state.member.user.tag}`);
        }
    }
});

client.login(process.env.TOKEN);

const add = (time, channel, guild) => {
    const ending = Date.now() + time;

    cache.setKey(Date.now(), { channel, ending, guild });
    cache.save();
};

client.addFocus = add;

setInterval(async () => {
    const keys = Object.entries(cache.all());

    if (keys.length) {
        for (const [
            id,
            { channel: channelID, ending, guild: guildID },
        ] of keys) {
            if (ending <= Date.now()) {
                const guild = await client.guilds.fetch(guildID);
                const channel = await guild.channels.fetch(channelID);

                for (const [, member] of channel.members) {
                    await member.voice.setMute(false);
                }

                cache.removeKey(id);
                cache.save();
            }
        }
    }
}, 5000);
