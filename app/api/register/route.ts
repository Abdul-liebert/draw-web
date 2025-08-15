// app/api/register/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

async function generateUniqueNomorPeserta(sheets: any, spreadsheetId: string) {
  // Ambil semua nomor peserta yang sudah ada (kolom A)
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Peserta!A:A",
  });

  const existingNumbers = new Set(
    (existing.data.values || [])
      .flat()
      .filter((val: string) => /^\d{3}$/.test(val))
  );

  let nomor: string;
  do {
    nomor = String(Math.floor(100 + Math.random() * 900)); // 3 digit random
  } while (existingNumbers.has(nomor));

  return nomor;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama, alamat, nomorJalan } = body;

    // Load credentials dari ENV
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: process.env.GOOGLE_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SHEET_ID as string;

    // Generate nomor peserta unik
    const nomorPeserta = await generateUniqueNomorPeserta(sheets, spreadsheetId);

    // Simpan data ke Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Peserta!A:E", // A = nomor, B = nama, dst
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          nomorPeserta,
          nama,
          alamat,
          nomorJalan,
          new Date().toLocaleString("id-ID"),
        ]],
      },
    });

    return NextResponse.json({ success: true, nomorPeserta });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}
