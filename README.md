# Converter Nota - Telegram Bot

Simple Node.js bot using Telegraf to convert bulk receipt text into a tidy table.

Usage

- Create a `.env` file or set environment var. (see `.env.example`)
- Install dependencies and run:

```bash
npm install
npm start
```

Before sending item list, the bot will first ask for the delivery destination. Reply with the destination name once, then proceed to send the item list.

Example message formats the bot accepts (each line is an item):

- `Indomie 5 3000`
- `Kopi Susu - 2 - 5000`
- `Beras lpt : 1 : 15000`

Lines that don't match the pattern are ignored. The bot replies with a text table summarizing totals. After sending the table it will display a button to download the receipt as a PDF.

Configuration and extras are in the code; tokens are loaded from `.env` using `dotenv`.
