import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
  amount: number | null;
  description: string | null;
  date: string | null; // YYYY-MM-DD
}

export async function ocrReceipt(
  file: File,
  onProgress?: (pct: number) => void
): Promise<OcrResult> {
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress ?? 0) * 100));
      }
    },
  });
  const text = data?.text ?? "";
  return parseReceiptText(text);
}

export function parseReceiptText(text: string): OcrResult {
  // Amount: pick the largest numeric value that looks like money
  const amountMatches = [...text.matchAll(/(?:Rs\.?|INR|₹)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/gi)];
  let amount: number | null = null;
  let maxAmt = 0;
  for (const m of amountMatches) {
    const num = parseFloat(m[1].replace(/,/g, ""));
    if (!isNaN(num) && num > maxAmt) {
      maxAmt = num;
      amount = num;
    }
  }

  // Date: dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  let date: string | null = null;
  const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dateMatch) {
    const d = dateMatch[1].padStart(2, "0");
    const mo = dateMatch[2].padStart(2, "0");
    let y = dateMatch[3];
    if (y.length === 2) y = "20" + y;
    date = `${y}-${mo}-${d}`;
  }

  // Description: first non-empty line, trimmed
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const description = lines.length ? lines[0].slice(0, 80) : null;

  return { text, amount, description, date };
}

/**
 * Optional: use Google Gemini (free tier) to structure the OCR text into fields.
 * Requires a user-provided API key. Falls back to heuristic parsing on failure.
 */
export async function structureWithGemini(
  apiKey: string,
  text: string
): Promise<Partial<OcrResult>> {
  try {
    const prompt =
      'Extract from this receipt text: amount (number), description (merchant/purpose, short), date (YYYY-MM-DD). ' +
      'Return ONLY a JSON object: {"amount":number|null,"description":string|null,"date":string|null}.\n\nReceipt text:\n' +
      text;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) return {};
    const json = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return {};
    const parsed = JSON.parse(match[0]);
    return {
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      description: typeof parsed.description === "string" ? parsed.description : null,
      date: typeof parsed.date === "string" ? parsed.date : null,
    };
  } catch {
    return {};
  }
}

/**
 * Full pipeline: OCR + (optional Gemini structuring).
 */
export async function scanReceipt(
  file: File,
  geminiApiKey?: string,
  onProgress?: (pct: number) => void
): Promise<OcrResult> {
  const base = await ocrReceipt(file, onProgress);
  if (geminiApiKey && geminiApiKey.trim()) {
    const structured = await structureWithGemini(geminiApiKey.trim(), base.text);
    return {
      text: base.text,
      amount: structured.amount ?? base.amount,
      description: structured.description ?? base.description,
      date: structured.date ?? base.date,
    };
  }
  return base;
}