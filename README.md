# 🧾 Converter Nota - Telegram Bot

A lightweight Telegram bot built with Node.js and Telegraf to automatically convert bulk receipt text into a clean, organized transaction table with PDF export support.

Designed to simplify receipt management and speed up transaction documentation workflows.

---

## ✨ Features

- 🤖 Telegram-based receipt converter
- 🧾 Automatically formats messy receipt text
- 📊 Generates clean transaction tables
- 📄 Export receipt as PDF
- ⚡ Fast and lightweight processing
- 🏷️ Delivery destination input support
- 🧠 Flexible text pattern recognition
- ✅ Ignores invalid or broken input lines automatically

---

## 🛠️ Tech Stack

- Node.js
- Telegraf
- dotenv
- PDF Generator

---

## 📸 Preview

Add screenshots here:
- Telegram bot interaction
- Generated receipt table
- PDF result preview

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/username/converter-nota-bot.git
cd converter-nota-bot
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment Variables

Create `.env` file and fill required values.

Example:

```env
BOT_TOKEN=your_telegram_bot_token
```

You can also check `.env.example` for reference.

---

## ▶️ Run The Bot

```bash
npm start
```

---

# 📖 Usage

Before sending item data, the bot will first ask for the delivery destination.

Reply with the destination name once, then continue by sending the item list.

---

## ✅ Supported Input Formats

Each line represents one item.

Examples:

```text
Indomie 5 3000
Kopi Susu - 2 - 5000
Beras lpt : 1 : 15000
```

The bot will automatically:
- detect item name
- calculate quantity
- summarize totals
- generate clean transaction table
- provide downloadable PDF receipt

---

# 📌 Notes

- Invalid lines are automatically ignored
- Tokens and configuration are loaded securely using `.env`
- Additional configurations can be adjusted directly in the source code

---

# 🎯 Purpose

This project was created to automate receipt formatting and transaction summarization workflows using Telegram as a simple and accessible interface.

---

# 🚀 Benefits

- Faster receipt processing
- Cleaner transaction documentation
- Reduces manual formatting
- Easy to use from mobile devices
- Suitable for operational and daily transaction workflows

---

# 👨‍💻 Author

Made with passion by JEK
