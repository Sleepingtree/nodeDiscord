# nodeDiscord

This project was created to help understand Typescript/node while building a functional discord bot.

## Set up

1. install [node](https://nodejs.org/en/download/).

2. once set up check out this repo

3. Navigate to the root location of the project and run

```bash
npm install
```

## Local devlopment

Highly recommend using the [visual studio code](https://code.visualstudio.com/) IDE.

as the start script and the sb script suggest the www file starts up the node http server and only has a basic shell config. 
app.ts handles most of the heavy lifting by initializing all of the needed files for start up including discordLogin.ts. From there each router/or service should be fairly 
self contained.

Most funtionality comes form the Discord intergration with light Twitch/Alexa intergration.

## Usage

Running the bot in a persistent way.

```bash
npm run sb
```

Personal forking and expleration is welcome.

