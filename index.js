require('dotenv').config();
const { Telegraf } = require('telegraf');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('Error: BOT_TOKEN environment variable not set.');
  process.exit(1);
}

const bot = new Telegraf(token);

const lastParsed = new Map();
const chatMeta = new Map();

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseNumber(s) {
  if (s == null) return NaN;
  let t = String(s).replace(/[^0-9.,]/g, '').trim();
  if (!t) return NaN;
  const hasDot = t.indexOf('.') !== -1;
  const hasComma = t.indexOf(',') !== -1;
  if (hasDot && hasComma) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    t = t.replace(/,/g, '.');
  } else if (hasDot) {
    if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  }
  return parseFloat(t);
}

const lineRegex = /^\s*(.+?)\s*[\s\-:]+\s*([0-9.,]+)\s*(?:([a-zA-Z0-9]+)\s*)?[\s\-:]+\s*([0-9.,]+)\s*$/;

function parseItems(text) {
  const lines = text.split(/\r?\n/);
  const items = [];
  let ignored = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(lineRegex);
    if (!m) { ignored++; continue; }
    const name = m[1].trim();
    const qty = parseNumber(m[2]);
    const unitName = m[3] || '';
    const price = parseNumber(m[4]);
    if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price < 0) {
      ignored++; continue;
    }
    items.push({ name, qty, unitName, price, total: qty * price });
  }
  return { items, ignored };
}

// ─────────────────────────────────────────────────────────────────────────────
// generatePDF — Epson Dot Matrix 9.5" Continuous Form
// Gaya visual sama dengan versi A4 asli:
//   header logo + nama perusahaan, garis divider, info nota 2-kolom,
//   tabel abu-abu dengan border & row separator, grand total, tanda tangan 3-kolom
// ─────────────────────────────────────────────────────────────────────────────
function generatePDF(items, dest) {
  return new Promise((resolve, reject) => {
    const tmpdir = os.tmpdir();
    const filename = path.join(tmpdir, `nota_${Date.now()}.pdf`);

    // 9.5" × 11" continuous form (portrait, tractor-feed standard)
    const PW = 9.5 * 72;   // 684 pt
    const PH = 11.0 * 72;  // 792 pt

    const doc = new PDFDocument({
      size: [PW, PH],
      margin: 0,
      autoFirstPage: true,
    });

    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);

    // ── Layout constants ────────────────────────────────────────────────────
    const ML = 20;               // margin kiri
    const MR = 16;               // margin kanan
    const MT = 16;               // margin atas
    const PRINT_W = PW - ML - MR; // 648 pt

    const ROW_H   = 18;          // tinggi baris tabel
    const LINE_H  = 14;          // jarak antar baris teks biasa

    // Kolom tabel: No | Item Barang | Qty | Harga Satuan | Total
    // Total lebar = 648 (pas PRINT_W)
    const colWidths = [24, 218, 88, 158, 160];
    const colX = [ML];
    for (let i = 0; i < colWidths.length - 1; i++) {
      colX.push(colX[i] + colWidths[i]);
    }

    let y = MT; // cursor Y dari atas halaman

    // Helper: cek overflow halaman, tambah halaman baru jika perlu
    function checkPage(needed = ROW_H) {
      if (y + needed > PH - 20) {
        doc.addPage({ size: [PW, PH], margin: 0 });
        y = MT;
      }
    }

    // ── 1. HEADER ───────────────────────────────────────────────────────────
    const logoPath = path.join(__dirname, 'logo.png');
    const LOGO_W = 75;
    const LOGO_H = 60;

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, ML, y, { width: LOGO_W, height: LOGO_H });
    } else {
      // Placeholder kotak logo kalau file tidak ada
      doc.rect(ML, y, LOGO_W, LOGO_H).lineWidth(0.5).stroke('#000000');
    }

    const TX = ML + LOGO_W + 12; // X teks kanan logo

    doc.fillColor('#000000')
       .font('Helvetica-Bold').fontSize(18)
       .text('KamalSupplies', TX, y + 4, { lineBreak: false });

    doc.font('Helvetica').fontSize(9)
       .text('Suplier Buah dan Sayuran', TX, y + 26, { lineBreak: false });
    doc.text('Alamat: Pasar Baru Blok C2 No.8910', TX, y + 38, { lineBreak: false });
    doc.text('WhatsApp: 0813-4636-0636  |  Instagram: @kamalsupplies', TX, y + 50, { lineBreak: false });

    y += LOGO_H + 8;

    // ── Garis divider tebal (seperti aslinya) ───────────────────────────────
    doc.moveTo(ML, y).lineTo(ML + PRINT_W, y).lineWidth(1.2).stroke('#000000');
    y += 10;

    // ── 2. INFO NOTA (2-kolom, persis seperti aslinya) ──────────────────────
    const COL2_X = ML + PRINT_W * 0.52;
    const tanggal = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });

    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    doc.text(`Nomor Nota : __________`,           ML,      y, { lineBreak: false });
    doc.text(`Tujuan     : ${dest || ''}`,         COL2_X,  y, { lineBreak: false });
    y += LINE_H;
    doc.text(`Nomor PO   : ____________`,          ML,      y, { lineBreak: false });
    doc.text(`Tanggal    : ${tanggal}`,            COL2_X,  y, { lineBreak: false });
    y += LINE_H + 8;

    // ── 3. TABEL ────────────────────────────────────────────────────────────
    const tableTop = y;

    // Header baris abu-abu (persis aslinya: fill #cccccc + stroke)
    doc.rect(ML, tableTop, PRINT_W, ROW_H)
       .fill('#cccccc').stroke('#000000');

    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9);
    doc.text('No',           colX[0], tableTop + 5, { width: colWidths[0], align: 'center',  lineBreak: false });
    doc.text('Item Barang',  colX[1], tableTop + 5, { width: colWidths[1], align: 'left',    lineBreak: false });
    doc.text('Qty',          colX[2], tableTop + 5, { width: colWidths[2], align: 'center',  lineBreak: false });
    doc.text('Harga Satuan', colX[3], tableTop + 5, { width: colWidths[3], align: 'right',   lineBreak: false });
    doc.text('Total',        colX[4], tableTop + 5, { width: colWidths[4], align: 'right',   lineBreak: false });

    // Garis vertikal di header
    doc.lineWidth(0.5).strokeColor('#000000');
    for (let i = 1; i < colX.length; i++) {
      doc.moveTo(colX[i], tableTop).lineTo(colX[i], tableTop + ROW_H).stroke();
    }

    y = tableTop + ROW_H;

    // Baris data
    let grand = 0;
    doc.font('Helvetica').fontSize(9);

    items.forEach((it, idx) => {
      checkPage(ROW_H + 4);
      grand += it.total;

      const qtyStr = `${it.qty}${it.unitName ? ' ' + it.unitName : ''}`;

      doc.fillColor('#000000');
      doc.text(String(idx + 1),          colX[0], y + 4, { width: colWidths[0], align: 'center',  lineBreak: false });
      doc.text(it.name,                  colX[1], y + 4, { width: colWidths[1], align: 'left',    lineBreak: false });
      doc.text(qtyStr,                   colX[2], y + 4, { width: colWidths[2], align: 'center',  lineBreak: false });
      doc.text(formatCurrency(it.price), colX[3], y + 4, { width: colWidths[3], align: 'right',   lineBreak: false });
      doc.text(formatCurrency(it.total), colX[4], y + 4, { width: colWidths[4], align: 'right',   lineBreak: false });

      y += ROW_H;

      // Garis bawah baris (tipis)
      doc.moveTo(ML, y).lineTo(ML + PRINT_W, y).lineWidth(0.3).stroke('#000000');
    });

    // Border luar seluruh tabel data
    const tableBodyH = items.length * ROW_H;
    doc.rect(ML, tableTop + ROW_H, PRINT_W, tableBodyH)
       .lineWidth(0.7).stroke('#000000');

    // Garis vertikal menembus seluruh baris data
    doc.lineWidth(0.4).strokeColor('#000000');
    for (let i = 1; i < colX.length; i++) {
      doc.moveTo(colX[i], tableTop + ROW_H)
         .lineTo(colX[i], tableTop + ROW_H + tableBodyH).stroke();
    }

    // ── 4. GRAND TOTAL (persis aslinya) ────────────────────────────────────
    checkPage(40);
    doc.moveTo(ML, y).lineTo(ML + PRINT_W, y).lineWidth(1).stroke('#000000');
    y += 10;

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000');
    doc.text(`GRAND TOTAL: Rp ${formatCurrency(grand)}`,
      colX[3], y, { width: colWidths[3] + colWidths[4], align: 'right', lineBreak: false });
    y += 36;

    // ── 5. TANDA TANGAN 3-KOLOM (persis aslinya) ───────────────────────────
    checkPage(80);
    const sigY    = y;
    const sigW    = PRINT_W / 3;

    doc.font('Helvetica').fontSize(9).fillColor('#000000');

    // Kiri: Penerima
    doc.text('Penerima / Barang Diterima,', ML,            sigY, { width: sigW, align: 'center', lineBreak: false });
    doc.text(`( ${dest || '________________'} )`,          ML,   sigY + 50, { width: sigW, align: 'center', lineBreak: false });

    // Tengah: kosong
    doc.text('',                                 ML + sigW,     sigY, { width: sigW, align: 'center', lineBreak: false });
    doc.text('(                              )', ML + sigW,     sigY + 50, { width: sigW, align: 'center', lineBreak: false });

    // Kanan: Hormat Kami
    doc.text('Hormat Kami,',                     ML + sigW * 2, sigY, { width: sigW, align: 'center', lineBreak: false });
    doc.text('( Kamal )',                         ML + sigW * 2, sigY + 50, { width: sigW, align: 'center', lineBreak: false });

    doc.end();
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

bot.start((ctx) => {
  chatMeta.delete(ctx.chat.id);
  lastParsed.delete(ctx.chat.id);
  chatMeta.set(ctx.chat.id, { lastActivity: Date.now() });
  ctx.replyWithHTML(
    '<b>Selamat datang di KamalSupplies!</b>\n\n' +
    'Silakan masukkan <b>tujuan pengiriman</b>\n\n' +
    'Perintah yang tersedia:\n' +
    '/start - Mulai transaksi\n' +
    '/reset - Hapus data transaksi'
  );
});

bot.command('reset', (ctx) => {
  chatMeta.delete(ctx.chat.id);
  lastParsed.delete(ctx.chat.id);
  ctx.reply('Data berhasil direset.\n\nSilakan mulai lagi dengan /start');
});

bot.on('text', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    if (!text) return;

    const meta = chatMeta.get(ctx.chat.id);
    if (!meta) {
      return ctx.reply('Silakan mulai dengan /start terlebih dahulu.');
    }

    // Tahap 1: Simpan Tujuan
    if (!meta.dest) {
      if (text.length > 60) {
        return ctx.reply('Tujuan terlalu panjang. Maksimal 60 karakter.');
      }
      meta.dest = text;
      meta.lastActivity = Date.now();
      chatMeta.set(ctx.chat.id, meta);
      return ctx.replyWithHTML(
        `✅ <b>Tujuan disimpan:</b> ${escapeHtml(text)}\n\n` +
        `Sekarang kirim daftar barang dengan format:\n` +
        `<code>Nama - Jumlah [Satuan] - Harga</code>\n\n` +
        `<b>Contoh:</b>\n` +
        `<code>Beras Ramos - 10 kg - 15000</code>\n` +
        `<code>Minyak - 5 liter - 35000</code>\n` +
        `<code>Kopi Susu - 2 - 5000</code>\n\n` +
        `<i>(Satuan opsional, tanpa nomor urut)</i>`
      );
    }

    // Tahap 2: Proses Barang
    const { items, ignored } = parseItems(text);
    if (items.length === 0) {
      return ctx.replyWithHTML(
        '<b>Format salah atau data tidak ditemukan.</b>\n' +
        'Pastikan formatnya: <code>Nama - Jumlah [Satuan] - Harga</code>\n\n' +
        'Contoh: <code>Telur - 5 kg - 28000</code>'
      );
    }

    if (items.length > 50) {
      return ctx.reply('Maksimal 50 item per nota.');
    }

    let grand = 0;
    let out = `<b>Tujuan:</b> ${escapeHtml(meta.dest)}\n\n`;
    items.forEach((it, idx) => {
      grand += it.total;
      out += `${idx + 1}. ${it.name} (${it.qty}${it.unitName ? ' ' + it.unitName : ''}) @${formatCurrency(it.price)} = ${formatCurrency(it.total)}\n`;
    });
    out += `\n<b>Grand Total: Rp ${formatCurrency(grand)}</b>`;
    if (ignored > 0) {
      out += `\n⚠️ ${ignored} baris tidak dapat dibaca dan dilewati.`;
    }

    await ctx.replyWithHTML(`<pre>${out}</pre>`);

    lastParsed.set(ctx.chat.id, { items, ignored, dest: meta.dest, lastActivity: Date.now() });

    const msg = await ctx.reply('Mau PDF? Klik tombol di bawah ini.', {
      reply_markup: {
        inline_keyboard: [[{ text: '📄 Kirim PDF Resmi', callback_data: 'send_pdf' }]]
      }
    });
    meta.pdfMessageId = msg.message_id;
    chatMeta.set(ctx.chat.id, meta);

  } catch (err) {
    console.error(err);
    await ctx.reply('Terjadi kesalahan. Silakan coba lagi.');
  }
});

bot.on('callback_query', async (ctx) => {
  if (ctx.callbackQuery.data === 'send_pdf') {
    const data = lastParsed.get(ctx.chat.id);
    if (!data) return ctx.answerCbQuery('Data tidak ditemukan. Silakan kirim daftar lagi.');

    try {
      await ctx.answerCbQuery('Sedang membuat PDF...');
      const filename = await generatePDF(data.items, data.dest);
      const safeDest = data.dest.replace(/[^a-z0-9]/gi, '_');

      try {
        await ctx.replyWithDocument({
          source: fs.createReadStream(filename),
          filename: `Nota_${safeDest}.pdf`
        });
      } finally {
        fs.unlink(filename, () => {});
      }

      lastParsed.delete(ctx.chat.id);

      if (data.pdfMessageId) {
        await ctx.telegram.editMessageReplyMarkup(
          ctx.chat.id, data.pdfMessageId, undefined, { inline_keyboard: [] }
        );
      }

      await ctx.reply('✅ Nota berhasil dibuat.\n\nSilakan mulai transaksi baru dengan /start');
    } catch (e) {
      console.error(e);
      await ctx.reply('Gagal membuat PDF.');
    }
  }
});

bot.command('help', (ctx) => {
  ctx.replyWithHTML(
    `<b>Format input barang:</b>\n\n` +
    `<code>Nama - Jumlah [Satuan] - Harga</code>\n\n` +
    `Contoh:\n` +
    `<code>Beras Ramos - 10 kg - 15000</code>\n` +
    `<code>Minyak - 5 liter - 35000</code>\n` +
    `<code>Kopi Susu - 2 - 5000</code>\n\n` +
    `Perintah:\n /start\n /reset\n /help`
  );
});

bot.launch().then(() => console.log('Bot KamalSupplies Aktif!'));

// Cleanup data lama setiap 2 jam
setInterval(() => {
  const now = Date.now();
  const ttl = 24 * 60 * 60 * 1000;
  for (const [id, entry] of chatMeta) {
    if (now - entry.lastActivity > ttl) chatMeta.delete(id);
  }
  for (const [id, entry] of lastParsed) {
    if (now - entry.lastActivity > ttl) lastParsed.delete(id);
  }
}, 2 * 60 * 60 * 1000);