import { createSlashCommand } from 'jellycommands';
import ms from 'ms';

export default createSlashCommand('focus', {
    description: 'Set a channel and a time to focus',

    guilds: ['556344107383914547'],

    options: [
        {
            name: 'start',
            description: 'Start a focus in a voice channel',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'channel',
                    type: 'CHANNEL',
                    description: 'The channel that should be in focus mode',
                    required: true,
                },
                {
                    name: 'time',
                    type: 'STRING',
                    description: 'The time you want to focus for',
                },
            ],
        },
        {
            name: 'end',
            description: 'End a focus session early',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'channel',
                    type: 'CHANNEL',
                    description: 'The channel that should be in focus mode',
                    required: true,
                },
            ],
        },
        {
            name: 'check',
            description: 'Check how long is left of a channel focus',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'channel',
                    type: 'CHANNEL',
                    description: 'The channel that should be in focus mode',
                    required: true,
                },
            ],
        },
    ],

    defer: true,

    run: async ({ interaction, client }) => {
        const channel = interaction.options.getChannel('channel');
        const subCommand = interaction.options.getSubcommand();

        if (!channel.isVoice())
            return interaction.followUp({
                ephemeral: true,
                embeds: [
                    {
                        description:
                            'This command only works on voice channels',
                        color: '#FF6347',
                    },
                ],
            });

        switch (subCommand) {
            case 'start':
                start({ interaction, client });
                break;

            case 'end':
                end({ interaction, client });
                break;

            case 'check':
                check({ interaction, client });
                break;

            default:
                interaction.followUp({
                    ephemeral: true,
                    embeds: [
                        {
                            description: 'Unable to find requested sub-command',
                            color: '#FF6347',
                        },
                    ],
                });
        }
    },
});

async function check({ interaction, client }) {
    const channel = interaction.options.getChannel('channel');
    const focus = client.focus.get(channel.id);

    if (!focus)
        return interaction.followUp({
            ephemeral: true,
            embeds: [
                {
                    description: `No focus session is active in ${channel.toString()}`,
                    color: '#FF6347',
                },
            ],
        });

    const left = ms(focus.ending - Date.now());

    return interaction.followUp({
        embeds: [
            {
                description: `There is \`${left}\` left of focus in ${channel.toString()}`,
                color: 'RANDOM',
            },
        ],
    });
}

async function start({ interaction, client }) {
    const timeStr = interaction.options.getString('time') || '20m';
    const channel = interaction.options.getChannel('channel');
    const timeMS = ms(timeStr);

    if (!timeMS)
        return interaction.followUp({
            ephemeral: true,
            embeds: [
                {
                    description: 'Please give a valid time, for example 25m',
                    color: '#FF6347',
                },
            ],
        });

    if (timeMS > ms('8h'))
        return interaction.followUp({
            ephemeral: true,
            embeds: [
                {
                    description: "Time can't be greater than 8h",
                    color: '#FF6347',
                },
            ],
        });

    for (const [, member] of channel.members) {
        if (!member.user.bot) await member.voice.setMute(true);
    }

    client.focus.add({
        time: timeMS,
        channelId: channel.id,
        guildId: channel.guild.id,
    });

    interaction.followUp({
        embeds: [
            {
                description: `${channel.toString()} has been focused for ${timeStr}`,
                color: 'RANDOM',
            },
        ],
    });
}

async function end({ interaction, client }) {
    const channel = interaction.options.getChannel('channel');

    client.focus.remove(channel.id);

    for (const [, member] of channel.members) {
        await member.voice.setMute(false);
    }

    interaction.followUp({
        embeds: [
            {
                description: `Focus ended in ${channel.toString()}`,
                color: 'RANDOM',
            },
        ],
    });
}
