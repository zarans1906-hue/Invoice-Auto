# 🧾 Converter Nota — Telegram Bot
<img width="1142" height="685" alt="Screenshot 2026-05-11 105104" src="https://github.com/user-attachments/assets/45c07cd8-4452-484a-ace9-90a142414c74" />
<img width="1406" height="962" alt="Screenshot 2026-05-11 105113" src="https://github.com/user-attachments/assets/00b7f07d-da5d-4715-b529-cfc2c6536317" />



A lightweight Telegram bot built with **Node.js** and **Telegraf** that automatically converts bulk receipt text into a clean, organized transaction table — with PDF export support.

Designed to simplify receipt management and speed up transaction documentation for daily operational workflows.

---

## ✨ Features

- 🤖 Telegram-based receipt converter — no app install needed
- 🧾 Automatically formats messy, unstructured receipt text
- 📊 Generates clean transaction summary tables
- 📄 Exports receipt as downloadable PDF
- 🏷️ Delivery destination input support
- 🧠 Flexible text pattern recognition (multiple input formats)
- ✅ Automatically ignores invalid or broken input lines
- ⚡ Fast and lightweight processing

---

## 📸 Preview

> _Add screenshots below to show how the bot works_

| Telegram Interaction | Generated Table | PDF Result |
|---|---|---|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Telegraf | Telegram Bot framework |
| PDF Generator | Receipt PDF export |
| dotenv | Secure environment config |

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/JEK642/converter-nota-bot.git
cd converter-nota-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
BOT_TOKEN=your_telegram_bot_token
```

> See `.env.example` for all available configuration options.

### 4. Run The Bot

```bash
npm start
```

---

## 📖 Usage

1. Start the bot on Telegram
2. When prompted, reply with the **delivery destination** name
3. Send your item list — one item per line

### ✅ Supported Input Formats

The bot accepts multiple formats for flexibility:

```text
Indomie 5 3000
Kopi Susu - 2 - 5000
Beras lpt : 1 : 15000
```

The bot will automatically:
- Detect item name, quantity, and price
- Calculate totals
- Generate a clean transaction table
- Provide a downloadable PDF receipt

---

## 📌 Notes

- Invalid or unrecognized lines are automatically skipped
- Credentials are loaded securely via `.env` — never hardcoded
- Additional configurations can be adjusted in the source code

---

## 👨‍💻 Author

Made with passion by **JEK** — [github.com/JEK642](https://github.com/JEK642)
