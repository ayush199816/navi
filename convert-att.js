const fs = require('fs');

const CREATED_BY_OID = process.env.CREATED_BY_OID || '68c444103564926ff5a3125f';
const COUNTRY = process.env.COUNTRY || 'Thailand';
const CURRENCY = process.env.CURRENCY || 'INR';
const INCLUDE_ID = (process.env.INCLUDE_ID || 'false').toLowerCase() === 'true';
const INCLUDE_MONGO_META = (process.env.INCLUDE_MONGO_META || 'true').toLowerCase() === 'true';

const nowIso = new Date().toISOString();

function randomObjectId() {
  const bytes = Buffer.alloc(12);
  for (let i = 0; i < 12; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return bytes.toString('hex');
}

function inferTransferType(nameRaw) {
  const name = (nameRaw || '').toLowerCase();
  if (name.includes('only ticket')) return 'NONE';
  if (name.includes('pvt') || name.includes('private')) return 'PVT';
  if (name.includes('sic') || name.includes('shared')) return 'SIC';
  return '';
}

function parsePrice(valueRaw) {
  const v = (valueRaw || '').toString().trim();
  if (!v) return null;
  const num = Number(v.replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  return num;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function toDoc({ name, sellingPrice }) {
  const transferType = inferTransferType(name);
  const normalizedSellingPrice = sellingPrice == null ? 0 : sellingPrice;
  const costPrice = normalizedSellingPrice === 0 ? 0 : round2(normalizedSellingPrice * 1.07);

  const doc = {
    name: name,
    type: 'activity',
    country: COUNTRY,
    transferType: transferType,
    sellingPrice: normalizedSellingPrice,
    costPrice: costPrice,
    details: '',
    description: '',
    location: '',
    isActive: true,
    createdBy: { $oid: CREATED_BY_OID },
    currency: CURRENCY
  };

  if (INCLUDE_MONGO_META) {
    doc.createdAt = { $date: nowIso };
    doc.updatedAt = { $date: nowIso };
    doc.__v = 0;
  }

  if (INCLUDE_ID) {
    doc._id = { $oid: randomObjectId() };
  }

  return doc;
}

function parseLines(text) {
  return text
    .split(/\r?\n/)
    .map(l => l.trimEnd())
    .filter(l => l.trim().length > 0);
}

function parseInput(text) {
  const lines = parseLines(text);
  const rows = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\t+/);
    if (parts.length === 1) {
      rows.push({ name: parts[0].trim(), sellingPrice: null });
      continue;
    }

    const priceRaw = parts[parts.length - 1];
    const nameRaw = parts.slice(0, -1).join(' ').trim();

    rows.push({
      name: nameRaw,
      sellingPrice: parsePrice(priceRaw)
    });
  }

  return rows;
}

async function main() {
  const input = fs.readFileSync(0, 'utf8');
  const rows = parseInput(input);
  const docs = rows.map(toDoc);
  process.stdout.write(JSON.stringify(docs, null, 2));
}

main().catch(err => {
  process.stderr.write(String(err?.stack || err));
  process.exit(1);
});
