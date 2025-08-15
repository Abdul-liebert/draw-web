import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/sheets";

type Hadiah = { hadiah: string; nomorHadiah: number; gambar: string; status: "tersedia" | "sudah" };
type Peserta = { nomorPeserta: number; nama: string };
type Winner = { id: number; nama: string; hadiah: string; nomorHadiah: number; nomorPeserta: number };

export async function GET() {
  try {
    const { sheets, spreadsheetId } = await getSheetsClient();

    const [hadiahRes, pesertaRes, winnersRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Hadiah!A2:D" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Peserta!A2:B" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "Pemenang!A2:E" }),
    ]);

    const hadiah: Hadiah[] =
      (hadiahRes.data.values || []).map((r) => ({
        hadiah: String(r[0] ?? ""),
        nomorHadiah: Number(r[1] ?? 0),
        gambar: String(r[2] ?? ""),
        status: (String(r[3] ?? "tersedia") as "tersedia" | "sudah"),
      })) ?? [];

    const peserta: Peserta[] =
      (pesertaRes.data.values || []).map((r) => ({
        nomorPeserta: Number(r[0] ?? 0),
        nama: String(r[1] ?? ""),
      })) ?? [];

    const winners: Winner[] =
      (winnersRes.data.values || []).map((r) => ({
        id: Number(r[0] ?? 0),
        nama: String(r[1] ?? ""),
        hadiah: String(r[2] ?? ""),
        nomorHadiah: Number(r[3] ?? 0),
        nomorPeserta: Number(r[4] ?? 0),
      })) ?? [];

    const nextId = (winners.reduce((m, w) => Math.max(m, w.id), 0) || 0) + 1;

    return NextResponse.json({ hadiah, peserta, winners, nextId });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
