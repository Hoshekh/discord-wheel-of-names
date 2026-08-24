import 'dotenv/config';
import { REST, Routes } from 'discord.js';

import * as spinCommand from './commands/spin.js';
import * as wheelCommand from './commands/wheel.js';

const commands = [
  spinCommand.data.toJSON(),
  wheelCommand.data.toJSON()
];

if (
  !process.env.DISCORD_TOKEN ||
  !process.env.DISCORD_CLIENT_ID ||
  !process.env.DISCORD_GUILD_ID
) {
  console.error(
    '❌ Missing DISCORD_TOKEN, DISCORD_CLIENT_ID or DISCORD_GUILD_ID'
  );
  process.exit(1);
}

const rest = new REST({ version: '10' })
  .setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
  try {
    console.log(
      `🔄 Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID
      ),
      {
        body: commands
      }
    );

    console.log(
      `✅ Successfully reloaded ${data.length} guild commands.`
    );

    console.log('\nRegistered commands:');

    data.forEach(cmd => {
      console.log(`   /${cmd.name} - ${cmd.description}`);
    });

  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    process.exit(1);
  }
}

deployCommands();
