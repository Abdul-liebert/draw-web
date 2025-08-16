import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/sheets";

export async function POST(req: Request) {
  try {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const body = await req.json();

    const { id, nama, hadiah, nomorHadiah, nomorPeserta } = body;

    // 0️⃣ Cek dulu apakah nomorHadiah sudah pernah dipakai
    const winnersRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Pemenang!A2:E",
    });

    const winners = winnersRes.data.values || [];
    const hadiahSudahDipakai = winners.some(
      (r) => Number(r[3]) === Number(nomorHadiah) // kolom D = nomorHadiah
    );

    if (hadiahSudahDipakai) {
      return NextResponse.json(
        { error: `Nomor hadiah ${nomorHadiah} sudah dimenangkan.` },
        { status: 409 }
      );
    }

    // 1️⃣ Tambahkan pemenang baru ke sheet Pemenang
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Pemenang!A2:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[id, nama, hadiah, nomorHadiah, nomorPeserta]],
      },
    });

    // 2️⃣ Update status hadiah di sheet Hadiah
    const hadiahRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Hadiah!A2:D",
    });

    const rows = hadiahRes.data.values || [];
    const rowIndex = rows.findIndex(
      (r) => Number(r[1]) === Number(nomorHadiah)
    );

    if (rowIndex !== -1) {
      const targetRow = rowIndex + 2; // +2 karena range mulai dari baris 2
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Hadiah!D${targetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["sudah"]],
        },
      });
    }

    // 3️⃣ Opsional: hapus peserta dari sheet Peserta
    const pesertaRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Peserta!A2:B",
    });

    const pesertaRows = pesertaRes.data.values || [];
    const pesertaRowIndex = pesertaRows.findIndex(
      (r) => Number(r[0]) === Number(nomorPeserta)
    );

    if (pesertaRowIndex !== -1) {
      const targetRow = pesertaRowIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Peserta!A${targetRow}:B${targetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["", ""]],
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error submitWinner:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
