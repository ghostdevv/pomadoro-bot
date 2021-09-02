import { createSlashCommand } from 'jellycommands';
import ms from 'ms';

export default createSlashCommand('focus', {
    description: 'Set a channel and a time to focus',

    guilds: ['556344107383914547'],

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

    defer: true,

    run: async ({ interaction, client }) => {
        const timeStr = interaction.options.getString('time') || '20m';
        const timeMS = ms(timeStr);

        const channel = interaction.options.getChannel('channel');

        if (!timeMS)
            return interaction.followUp({
                ephemeral: true,
                embeds: [
                    {
                        description:
                            'Please give a valid time, for example 25m',
                        color: '#FF6347',
                    },
                ],
            });

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

        for (const [, member] of channel.members) {
            await member.voice.setMute(true);
        }

        client.addFocus(timeMS, channel.id, channel.guild.id);

        interaction.followUp({
            embeds: [
                {
                    description: `${channel.toString()} has been focused for ${timeStr}`,
                    color: 'RANDOM',
                },
            ],
        });
    },
});
