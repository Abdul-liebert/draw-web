import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/sheets";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hadiah, peserta } = body as {
      hadiah: { hadiah: string; nomorHadiah: number; gambar: string; status: "tersedia" | "sudah" }[];
      peserta: { nomorPeserta: number; nama: string }[];
    };

    const { sheets, spreadsheetId } = await getSheetsClient();

    // Clear all
     await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "Pemenang!A2:E10000", // Sesuaikan nama sheet kalau bukan 'Pemenang'
    });

    // Write hadiah
    if (hadiah?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Hadiah!A2:D",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: hadiah.map(h => [h.hadiah, h.nomorHadiah, h.gambar, h.status]) },
      });
    }

    // Write peserta
    if (peserta?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Peserta!A2:B",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: peserta.map(p => [p.nomorPeserta, p.nama]) },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
