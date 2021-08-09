import 'dotenv/config';
import { Client, Intents } from 'discord.js';
import { JellyCommands } from 'jellycommands';

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const jelly = new JellyCommands(client);

jelly.slashCommands.load('dev/slashCommands');

client.on('ready', () => {
    console.log('Online');
    jelly.slashCommands.register();
});

client.login(process.env.TOKEN);
