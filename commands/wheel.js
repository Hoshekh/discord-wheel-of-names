import {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder
} from 'discord.js';

import { generateWheelGIF } from '../wheel-generator.js';

import {
  getWheels,
  getWheel,
  createWheel,
  deleteWheel,
  recordSpin
} from '../wheel-storage.js';

export const data = new SlashCommandBuilder()
  .setName('wheel')
  .setDescription('Manage and spin saved wheels')

  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List all saved wheels')
  )

.addSubcommand(subcommand =>
  subcommand
    .setName('spin')
    .setDescription('Spin a saved wheel')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Name of the wheel to spin')
        .setRequired(true)
    )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create and save a new wheel')

      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Name of the wheel')
          .setRequired(true)
      )

      .addStringOption(option =>
        option
          .setName('entries')
          .setDescription('Comma-separated list of entries')
          .setRequired(true)
      )

      .addStringOption(option =>
        option
          .setName('color')
          .setDescription('Color theme')
          .addChoices(
            { name: 'Uplup', value: 'uplup' },
            { name: 'Vibrant', value: 'vibrant' },
            { name: 'Pastel', value: 'pastel' },
            { name: 'Sunset', value: 'sunset' },
            { name: 'Ocean', value: 'ocean' }
          )
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Delete a saved wheel')
      .addStringOption(option =>
        option
          .setName('wheel_id')
          .setDescription('The wheel ID to delete')
          .setRequired(true)
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName('info')
      .setDescription('View information about a saved wheel')
      .addStringOption(option =>
        option
          .setName('wheel_id')
          .setDescription('The wheel ID to view')
          .setRequired(true)
      )
  );

export async function execute(interaction) {

  const subcommand = interaction.options.getSubcommand();

  try {

    /* =========================
       LIST
    ========================= */

    if (subcommand === 'list') {

      const wheels = await getWheels();

      if (wheels.length === 0) {
        await interaction.reply({
          content:
            'You do not have any saved wheels yet!\n\n' +
            'Create one using `/wheel create`.',
          ephemeral: true
        });

        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x6C60D7)
        .setTitle('🎡 Saved Wheels')
        .setDescription(
          wheels.map((wheel, index) =>
            `**${index + 1}. ${wheel.name}**\n` +
            `ID: \`${wheel.id}\`\n` +
            `Entries: ${wheel.entries.length}`
          ).join('\n\n')
        );

      await interaction.reply({
        embeds: [embed]
      });

      return;
    }


    /* =========================
       CREATE
    ========================= */

    if (subcommand === 'create') {

      const name = interaction.options.getString('name');

      const entriesString =
        interaction.options.getString('entries');

      const color =
        interaction.options.getString('color') || 'uplup';

      const entries = entriesString
        .split(',')
        .map(entry => entry.trim())
        .filter(entry => entry.length > 0);

      if (entries.length < 2) {

        await interaction.reply({
          content:
            '❌ You need at least **2 entries**.',
          ephemeral: true
        });

        return;
      }

      if (entries.length > 100) {

        await interaction.reply({
          content:
            '❌ A wheel can contain a maximum of **100 entries**.',
          ephemeral: true
        });

        return;
      }

      const wheel =
        await createWheel(name, entries, color);

      const embed = new EmbedBuilder()
        .setColor(0x4CAF50)
        .setTitle('🎡 Wheel Created!')
        .addFields(
          {
            name: 'Name',
            value: wheel.name,
            inline: true
          },
          {
            name: 'ID',
            value: `\`${wheel.id}\``,
            inline: true
          },
          {
            name: 'Entries',
            value: `${wheel.entries.length}`,
            inline: true
          }
        )
        .setDescription(
          'Your wheel is now saved directly in the bot.\n\n' +
          `Use \`/wheel spin wheel_id:${wheel.id}\` to spin it!`
        );

      await interaction.reply({
        embeds: [embed]
      });

      return;
    }


    /* =========================
       SPIN
    ========================= */

    if (subcommand === 'spin') {

      await interaction.deferReply();

const wheelName =
  interaction.options.getString('name');

const wheels =
  await getWheels();

const wheel =
  wheels.find(
    wheel =>
      wheel.name.toLowerCase() === wheelName.toLowerCase()
  );

      if (!wheel) {

        await interaction.editReply({
          content:
            '❌ Wheel not found.\n' +
            'Use `/wheel list` to see your saved wheels.'
        });

        return;
      }

const winnerIndex =
  Math.floor(Math.random() * wheel.entries.length);

const winner =
  wheel.entries[winnerIndex];

const gifBuffer =
  await generateWheelGIF(
    wheel.entries,
    {
      colorPalette: wheel.color,
      winner: winner,
      duration: 3000,
      fps: 20,
      spinRevolutions: 5
    }
  );

      await recordSpin(
        wheel.id,
        winner
      );

      const attachment =
        new AttachmentBuilder(
          gifBuffer,
          {
            name: 'wheel-spin.gif'
          }
        );

      const embed = new EmbedBuilder()
        .setColor(0x6C60D7)
        .setTitle(`🎡 ${wheel.name}`)
        .setDescription(
          `✨ **The wheel has chosen:**\n\n` +
          `# ${winner}`
        )
        .setImage('attachment://wheel-spin.gif')
        .setFooter({
          text: `Saved wheel • ${wheel.entries.length} entries`
        });

      await interaction.editReply({
        embeds: [embed],
        files: [attachment]
      });

      return;
    }


    /* =========================
       INFO
    ========================= */

    if (subcommand === 'info') {

      const wheelId =
        interaction.options.getString('wheel_id');

      const wheel =
        await getWheel(wheelId);

      if (!wheel) {

        await interaction.reply({
          content: '❌ Wheel not found.',
          ephemeral: true
        });

        return;
      }

      const preview =
        wheel.entries
          .slice(0, 20)
          .map((entry, index) =>
            `${index + 1}. ${entry}`
          )
          .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x6C60D7)
        .setTitle(`🎡 ${wheel.name}`)
        .addFields(
          {
            name: 'Wheel ID',
            value: `\`${wheel.id}\``
          },
          {
            name: 'Entries',
            value: `${wheel.entries.length}`,
            inline: true
          },
          {
            name: 'Spins',
            value: `${wheel.spins.length}`,
            inline: true
          },
          {
            name: 'Preview',
            value: preview
          }
        );

      await interaction.reply({
        embeds: [embed]
      });

      return;
    }


    /* =========================
       DELETE
    ========================= */

    if (subcommand === 'delete') {

      const wheelId =
        interaction.options.getString('wheel_id');

      const deleted =
        await deleteWheel(wheelId);

      if (!deleted) {

        await interaction.reply({
          content: '❌ Wheel not found.',
          ephemeral: true
        });

        return;
      }

      await interaction.reply({
        content:
          `🗑️ Wheel \`${wheelId}\` has been deleted.`
      });

      return;
    }

  } catch (error) {

    console.error(
      'Wheel command error:',
      error
    );

    const message = {
      content:
        `❌ An error occurred: ${error.message}`,
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message);
    } else {
      await interaction.reply(message);
    }
  }
}
