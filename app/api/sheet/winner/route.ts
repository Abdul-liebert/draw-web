import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/sheets";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, nama, hadiah, nomorHadiah, nomorPeserta } = body as {
      id: number;
      nama: string;
      hadiah: string;
      nomorHadiah: number;
      nomorPeserta: number;
    };

    const { sheets, spreadsheetId } = await getSheetsClient();

    // 🔍 0) Cek apakah peserta ini sudah menang hadiah ini
    const pemenangRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Pemenang!A:E",
    });

    const pemenangRows = pemenangRes.data.values || [];
    const sudahMenang = pemenangRows.some(row => {
      const rowNomorPeserta = Number(row[4]); // Kolom E = nomorPeserta
      const rowNomorHadiah = Number(row[3]);  // Kolom D = nomorHadiah
      return rowNomorPeserta === nomorPeserta && rowNomorHadiah === nomorHadiah;
    });

    if (sudahMenang) {
      return NextResponse.json(
        { error: "Peserta ini sudah pernah menang hadiah tersebut" },
        { status: 400 }
      );
    }

    // 1) Append ke Pemenang
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Pemenang!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[id, nama, hadiah, nomorHadiah, nomorPeserta]] },
    });

    // 2) Update stok hadiah
    const hadiahData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Hadiah!A:E", // A = Nama Hadiah, B = Stok
    });

    const hadiahRows = hadiahData.data.values || [];
    for (let i = 0; i < hadiahRows.length; i++) {
      const [namaHadiah, stokStr] = hadiahRows[i];
      if (namaHadiah === hadiah) {
        let stok = parseInt(stokStr, 10) || 0;
        if (stok > 0) stok -= 1;

        // Update stok di sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Hadiah!B${i + 1}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[stok]] },
        });
        break;
      }
    }

    // 3) Hapus peserta dari daftar peserta
    const pesertaRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Peserta!A2:B",
    });
    const pesertaRows = pesertaRes.data.values || [];
    const filtered = pesertaRows.filter(
      r => Number(r[0]) !== Number(nomorPeserta)
    );

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "Peserta!A2:B10000",
    });
    if (filtered.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Peserta!A2:B",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: filtered },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
