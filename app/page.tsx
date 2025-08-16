"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Hadiah = {
  hadiah: string;
  nomorHadiah: number;
  gambar: string;
  status: "tersedia" | "sudah";
};
type Peserta = { nomorPeserta: number; nama: string };
type Winner = {
  id: number;
  nama: string;
  hadiah: string;
  nomorHadiah: number;
  nomorPeserta: number;
};

const initialHadiahList: Hadiah[] = [
  { hadiah: "Mobil", nomorHadiah: 1, gambar: "/mobil.png", status: "tersedia" },
  { hadiah: "Motor", nomorHadiah: 2, gambar: "/motor.jpg", status: "tersedia" },
  {
    hadiah: "Laptop",
    nomorHadiah: 3,
    gambar: "/laptop.jpg",
    status: "tersedia",
  },
];

const initialPesertaList: Peserta[] = [
  { nomorPeserta: 11, nama: "Andi" },
  { nomorPeserta: 99, nama: "Budi" },
  { nomorPeserta: 53, nama: "Citra" },
  { nomorPeserta: 87, nama: "Dedi" },
  { nomorPeserta: 32, nama: "Eka" },
  { nomorPeserta: 75, nama: "Farah" },
  { nomorPeserta: 8, nama: "Gilang" },
];

export default function DoorprizeDraw() {
  const [hadiahList, setHadiahList] = useState<Hadiah[]>([]);
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [nextId, setNextId] = useState(1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPeserta, setCurrentPeserta] = useState("--");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Peserta | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hadiahSekarang = hadiahList[currentIndex];

  // Load dari Google Sheets (via API)
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/sheet", { cache: "no-store" });
      const data = await res.json();
      setHadiahList(data.hadiah ?? []);
      setPesertaList(data.peserta ?? []);
      setWinners(data.winners ?? []);
      setNextId(data.nextId ?? 1);
      setCurrentIndex(0);
      setCurrentPeserta("--");
    })();
  }, []);

  const startDraw = () => {
    if (!pesertaList.length || !hadiahSekarang) return;
    setRunning(true);
    setTimeLeft(3);

    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    intervalRef.current = setInterval(() => {
      const randomPeserta =
        pesertaList[Math.floor(Math.random() * pesertaList.length)];
      setCurrentPeserta(randomPeserta.nomorPeserta.toString());
    }, 100);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);

      const winnerPeserta =
        pesertaList[Math.floor(Math.random() * pesertaList.length)];
      setSelectedWinner(winnerPeserta);
      setDialogOpen(true);
      setRunning(false);
      setTimeLeft(null);
    }, 3000);
  };

  const submitWinner = async () => {
    if (!selectedWinner || !hadiahSekarang) return;

    // 1) Simpan ke Sheet (append winners, update hadiah, hapus peserta)
    await fetch("/api/sheet/winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: nextId,
        nama: selectedWinner.nama,
        hadiah: hadiahSekarang.hadiah,
        nomorHadiah: hadiahSekarang.nomorHadiah,
        nomorPeserta: selectedWinner.nomorPeserta,
      }),
    });

    // 2) Update state lokal agar UI langsung sinkron
    setWinners((prev) => [
      ...prev,
      {
        id: nextId,
        nama: selectedWinner.nama,
        hadiah: hadiahSekarang.hadiah,
        nomorHadiah: hadiahSekarang.nomorHadiah,
        nomorPeserta: selectedWinner.nomorPeserta,
      },
    ]);

    setHadiahList((prev) =>
      prev.map((h, idx) =>
        idx === currentIndex ? { ...h, status: "sudah" } : h
      )
    );

    setPesertaList((prev) =>
      prev.filter((p) => p.nomorPeserta !== selectedWinner.nomorPeserta)
    );

    setNextId((prev) => prev + 1);
    setDialogOpen(false);
    setCurrentPeserta("--");
  };

  const nextHadiah = () => {
    if (currentIndex < hadiahList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentPeserta("--");
    }
  };

  async function resetUndian() {
    const ok = confirm("Yakin ingin mereset semua data?");
    if (!ok) return;

    // Reset di Spreadsheet sesuai initial (kirim dari client agar sederhana)
    await fetch("/api/sheet/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hadiah: initialHadiahList,
        peserta: initialPesertaList,
      }),
    });

    // Ambil ulang
    const res = await fetch("/api/sheet", { cache: "no-store" });
    const data = await res.json();
    setHadiahList(data.hadiah ?? []);
    setPesertaList(data.peserta ?? []);
    setWinners(data.winners ?? []);
    setNextId(data.nextId ?? 1);
    setCurrentIndex(0);
    setCurrentPeserta("--");
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const allHadiahSelesai = hadiahList.every((h) => h.status === "sudah");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="my-4 flex flex-col text-center items-center gap-2">
        <Badge variant="outline">
          🎉Selamat memperingati HUT RI yang ke 80
        </Badge>
        <h2 className="text-5xl font-bold">HUT RI 80 Cluster Le Jardin BETA</h2>
      </div>

      <Card className="w-full p-6 flex flex-col items-center justify-center gap-6">
        <CardContent className="space-y-8 flex flex-col lg:flex-row items-center justify-center gap-6 w-full">
          {/* Card Hadiah */}
          {hadiahSekarang && (
            <Card
              className={`shadow p-4 bg-red-600 text-white flex-1 max-w-sm w-full ${
                hadiahSekarang.status === "sudah" ? "opacity-50" : ""
              }`}
            >
              
              <CardContent>
                <Image
                  src={hadiahSekarang.gambar}
                  alt={hadiahSekarang.hadiah}
                  width={300}
                  height={200}
                  className="rounded-lg object-cover bg-white p-4 w-full h-auto"
                />
                <p className="mt-4 text-lg text-center font-bold">
                  {hadiahSekarang.hadiah}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Control & Peserta */}
          <div className="flex flex-col gap-4 flex-1 justify-between max-w-sm w-full">
            <Card className="shadow py-4 bg-red-600 w-full">
              <CardHeader className="pt-4">
                <CardTitle className="text-center text-lg text-white">
                  Nomor Undian
                </CardTitle>
              </CardHeader>
              <CardContent className="mb-3 flex items-center justify-center">
                <span className="text-6xl sm:text-8xl font-bold text-white">
                  {currentPeserta || "-"}
                </span>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-lg font-bold text-red-500">
                ⏳ {timeLeft ?? 0} detik
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-2 border-red-600 text-red-600"
                  onClick={nextHadiah}
                  disabled={
                    !hadiahSekarang ||
                    hadiahSekarang.status !== "sudah" ||
                    currentIndex >= hadiahList.length - 1 ||
                    allHadiahSelesai
                  }
                >
                  Next Hadiah
                </Button>
                <Button
                  onClick={startDraw}
                  variant="destructive"
                  disabled={
                    running ||
                    !hadiahSekarang ||
                    hadiahSekarang.status === "sudah" ||
                    pesertaList.length === 0
                  }
                >
                  {running ? "Mengundi..." : "Draw"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Tabel Pemenang */}
        <CardContent className="lg:w-full p-6 border-2 border-red-600 rounded-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold mb-4 text-red-500">
              Daftar Pemenang
            </h2>
            <Button variant="destructive" onClick={resetUndian}>
              Reset Daftar Pemenang
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Hadiah</TableHead>
                <TableHead>No Hadiah</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>No Peserta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.length > 0 ? (
                winners.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.id}</TableCell>
                    <TableCell>{w.hadiah}</TableCell>
                    <TableCell>{w.nomorHadiah}</TableCell>
                    <TableCell>{w.nama}</TableCell>
                    <TableCell>{w.nomorPeserta}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Belum ada pemenang
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Pemenang */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {hadiahSekarang && (
            <Card className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
              <div className="bg-white flex items-center justify-center border p-6">
                <Image
                  src={hadiahSekarang.gambar}
                  alt={hadiahSekarang.hadiah}
                  width={250}
                  height={250}
                />
              </div>
              <CardContent className="flex flex-col justify-center p-8">
                <div className="space-y-4">
                  <div>
                    <Label>Nama Hadiah</Label>
                    <p className="text-lg font-bold">{hadiahSekarang.hadiah}</p>
                  </div>
                  <div>
                    <Label>Nomor Hadiah</Label>
                    <p className="text-lg">{hadiahSekarang.nomorHadiah}</p>
                  </div>
                  <div>
                    <Label>Nama Pemenang</Label>
                    <p className="text-lg font-bold">
                      {selectedWinner?.nama ?? ""}
                    </p>
                  </div>
                  <div>
                    <Label>No. Peserta</Label>
                    <p>{selectedWinner?.nomorPeserta ?? ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <Button
            className="mt-6 w-full"
            variant="destructive"
            onClick={submitWinner}
          >
            Submit
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
