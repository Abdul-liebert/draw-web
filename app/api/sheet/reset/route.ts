import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/sheets";

export const runtime = "nodejs"; // karena pakai googleapis


export async function POST(req: Request) {
  try {
    const { sheets, spreadsheetId } = await getSheetsClient();

    // === 1. Ambil semua pemenang dulu ===
    const winnersRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Pemenang!A2:E",
    });
    const winners = winnersRes.data.values || [];

    // === 2. Ambil semua peserta sekarang ===
    const pesertaRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Peserta!A2:B",
    });
    const peserta = pesertaRes.data.values || [];

    // === 3. Gabungkan peserta lama + pemenang ===
    // winners = [id, nama, hadiah, nomorHadiah, nomorPeserta]
    const restoredPeserta = [
      ...peserta,
      ...winners.map((w) => [w[4] ?? "", w[1] ?? ""]), // nomorPeserta, nama
    ];

    // Hilangkan duplikat berdasarkan nomorPeserta
    const uniquePeserta = Array.from(
      new Map(restoredPeserta.map((p) => [String(p[0]), p])).values()
    ).sort((a, b) => Number(a[0]) - Number(b[0]));

    // === 4. Clear daftar pemenang ===
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "Pemenang!A2:E10000",
    });

    // === 5. Reset status hadiah ===
    const hadiahRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Hadiah!A2:D",
    });
    const hadiah = (hadiahRes.data.values || []).map((r) => [
      r[0] ?? "",       // hadiah
      r[1] ?? "",       // nomorHadiah
      r[2] ?? "",       // gambar
      "tersedia",       // reset status
    ]);

    if (hadiah.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Hadiah!A2:D",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: hadiah },
      });
    }

    // === 6. Restore peserta ===
    if (uniquePeserta.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Peserta!A2:B",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: uniquePeserta },
      });
    }

    return NextResponse.json({
      ok: true,
      reset: true,
      restoredPeserta: uniquePeserta.length,
      hadiahReset: hadiah.length,
    });
  } catch (e: any) {
    console.error("RESET ERROR:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
