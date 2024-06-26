const fs = require("fs");
const dotenv = require("dotenv");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");
const { VoiceConnectionStatus } = require("@discordjs/voice");
const { Player } = require("discord-player");
const express = require("express");
require("console-stamp")(console, { format: ":date(yyyy/mm/dd HH:MM:ss)" });

dotenv.config();
const ENV = process.env;
const embed = require("./src/embeds/embeds");

const color = {
  white: "\x1B[0m",
  grey: "\x1B[2m",
  green: "\x1B[32m",
};

let client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
  disableMentions: "everyone",
});

client.config = {};

client.config.ytdlOptions = {
  filter: "audioonly",
  quality: "highestaudio",
  highWaterMark: 1 << 27,
};

client.commands = new Collection();
client.player = new Player(client, {
  ytdlOptions: client.config.ytdlOptions,
});
const player = client.player;

const setEnvironment = () => {
  client.config.name = ENV.BOT_NAME;

  client.config.prefix = ENV.PREFIX;

  client.config.playing = ENV.PLAYING;

  client.config.defaultVolume = Number(ENV.DEFAULT_VOLUME);

  client.config.maxVolume = Number(ENV.MAX_VOLUME);

  client.config.autoLeave = String(ENV.AUTO_LEAVE) === "true" ? true : false;

  client.config.autoLeaveCooldown = Number(ENV.AUTO_LEAVE_COOLDOWN);

  client.config.displayVoiceState =
    String(ENV.DISPLAY_VOICE_STATE) === "true" ? true : false;

  return;
};

const loadEvents = () => {
  console.log(`-> loading Events ......`);
  return new Promise((resolve, reject) => {
    const events = fs
      .readdirSync("./src/events/")
      .filter((file) => file.endsWith(".js"));

    console.log(`+--------------------------------+`);
    for (const file of events) {
      try {
        const event = require(`./src/events/${file}`);
        console.log(`| Loaded event ${file.split(".")[0].padEnd(17, " ")} |`);

        client.on(file.split(".")[0], event.bind(null, client));
        delete require.cache[require.resolve(`./src/events/${file}`)];
      } catch (error) {
        reject(error);
      }
    }
    console.log(`+--------------------------------+`);
    console.log(`${color.grey}-- loading Events finished --${color.white}`);

    resolve();
  });
};

const loadCommands = () => {
  console.log(`-> loading Commands ......`);
  return new Promise((resolve, reject) => {
    fs.readdir("./src/commands/", (err, files) => {
      console.log(`+---------------------------+`);
      if (err) return console.log("Could not find any commands!");

      const jsFiles = files.filter((file) => file.endsWith(".js"));

      if (jsFiles.length <= 0)
        return console.log("Could not find any commands!");

      for (const file of jsFiles) {
        try {
          const command = require(`./src/commands/${file}`);

          console.log(
            `| Loaded Command ${command.name.toLowerCase().padEnd(10, " ")} |`
          );

          client.commands.set(command.name.toLowerCase(), command);
          delete require.cache[require.resolve(`./src/commands/${file}`)];
        } catch (error) {
          reject(error);
        }
      }
      console.log(`+---------------------------+`);
      console.log(`${color.grey}-- loading Commands finished --${color.white}`);

      resolve();
    });
  });
};

Promise.all([setEnvironment(), loadEvents(), loadCommands()]).then(() => {
  console.log(`${color.green}*** All loaded successfully ***${color.white}`);
  client.login(ENV.TOKEN);
});

const settings = (queue, song) =>
  `**Volume**: \`${queue.volume}%\` | **Loop**: \`${
    queue.repeatMode ? (queue.repeatMode === 2 ? "All" : "ONE") : "Off"
  }\``;

player.on("error", (queue, error) => {
  console.log(`There was a problem with the song queue => ${error.message}`);
});

player.on("connectionError", (queue, error) => {
  console.log(`I'm having trouble connecting => ${error.message}`);
});

player.on("trackStart", (queue, track) => {
  if (queue.repeatMode !== 0) return;
  queue.metadata.send({
    embeds: [
      embed.Embed_play(
        "Playing",
        track.title,
        track.url,
        track.duration,
        track.thumbnail,
        settings(queue)
      ),
    ],
  });
});

player.on("trackAdd", (queue, track) => {
  if (queue.previousTracks.length > 0)
    queue.metadata.send({
      embeds: [
        embed.Embed_play(
          "Added",
          track.title,
          track.url,
          track.duration,
          track.thumbnail,
          settings(queue)
        ),
      ],
    });
});

player.on("connectionCreate", (queue) => {
  queue.connection.voiceConnection.on("stateChange", (oldState, newState) => {
    const oldNetworking = Reflect.get(oldState, "networking");
    const newNetworking = Reflect.get(newState, "networking");

    const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
      const newUdp = Reflect.get(newNetworkState, "udp");
      clearInterval(newUdp?.keepAliveInterval);
    };

    oldNetworking?.off("stateChange", networkStateChangeHandler);
    newNetworking?.on("stateChange", networkStateChangeHandler);
  });
});
player.on("channelEmpty", (queue) => {
  if (!client.config.autoLeave) queue.stop();
});
