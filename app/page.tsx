"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type Peserta = {
  nomorPeserta: number;
  nama: string;
};

type Winner = {
  nama: string;
  id: number;
  hadiah: string;
  nomorHadiah: number;
  nomorPeserta: number;
};

export default function DoorprizeDraw() {
  const initialHadiahList: Hadiah[] = [
  { hadiah: "Mobil", nomorHadiah: 1, gambar: "/mobil.png", status: "tersedia" },
  { hadiah: "Motor", nomorHadiah: 2, gambar: "/motor.jpg", status: "tersedia" },
  { hadiah: "Laptop", nomorHadiah: 3, gambar: "/laptop.jpg", status: "tersedia" },
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

const [hadiahList, setHadiahList] = useState<Hadiah[]>(initialHadiahList);
const [pesertaList, setPesertaList] = useState<Peserta[]>(initialPesertaList);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPeserta, setCurrentPeserta] = useState("--");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Peserta | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [nextId, setNextId] = useState(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hadiahSekarang = hadiahList[currentIndex];

  const startDraw = () => {
    setRunning(true);
    setTimeLeft(3);

    // countdown
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    // animasi peserta acak
    intervalRef.current = setInterval(() => {
      const randomPeserta =
        pesertaList[Math.floor(Math.random() * pesertaList.length)];
      setCurrentPeserta(randomPeserta.nomorPeserta.toString());
    }, 100);

    
    // stop setelah 3 detik
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


  function resetUndian() {
  setWinners([]);
  setPesertaList(initialPesertaList);
  setHadiahList(initialHadiahList);
  setCurrentIndex(0);
  setCurrentPeserta("--");
  setNextId(1);
  localStorage.clear();
}

  const submitWinner = () => {
    if (!selectedWinner) return;

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

  useEffect(() => {
    const savedWinners = localStorage.getItem("winners");
    const savedNextId = localStorage.getItem("nextId");
    const savedPesertaList = localStorage.getItem("pesertaList");
    const savedHadiahList = localStorage.getItem("hadiahList");
    const savedCurrentIndex = localStorage.getItem("currentIndex");

    if (savedWinners) setWinners(JSON.parse(savedWinners));
    if (savedNextId) setNextId(Number(savedNextId));
    if (savedPesertaList) setPesertaList(JSON.parse(savedPesertaList));
    if (savedHadiahList) setHadiahList(JSON.parse(savedHadiahList));
    if (savedCurrentIndex) setCurrentIndex(Number(savedCurrentIndex));
  }, []);

  // Simpan winners setiap berubah
  useEffect(() => {
    localStorage.setItem("winners", JSON.stringify(winners));
  }, [winners]);

  // Simpan nextId setiap berubah
  useEffect(() => {
    localStorage.setItem("nextId", String(nextId));
  }, [nextId]);

  // Simpan pesertaList setiap berubah
  useEffect(() => {
    localStorage.setItem("pesertaList", JSON.stringify(pesertaList));
  }, [pesertaList]);

  // Simpan hadiahList setiap berubah
  useEffect(() => {
    localStorage.setItem("hadiahList", JSON.stringify(hadiahList));
  }, [hadiahList]);

  // Simpan currentIndex setiap berubah
  useEffect(() => {
    localStorage.setItem("currentIndex", String(currentIndex));
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const allHadiahSelesai = hadiahList.every((h) => h.status === "sudah");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center  p-6">
      <div className="my-4 flex flex-col text-center items-center gap-2">
        <Badge variant={"outline"}>
          🎉Selamat memperingati HUT RI yang ke 80
        </Badge>
        <h2 className="text-5xl font-bold">HUT RI 80 Komplek Asri indah</h2>
        <p className="text-lg text-gray-400">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis,
          fuga.
        </p>
      </div>
      <Card className="w-full p-6 flex flex-col items-center justify-center gap-6">
        <CardContent className="space-y-8 flex flex-col lg:flex-row items-center justify-center  gap-6 w-full">
          {/* Card Hadiah */}
          <Card
            className={`shadow p-4 bg-red-600 text-white flex-1 max-w-sm w-full ${
              hadiahSekarang.status === "sudah" ? "opacity-50" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="text-center">
                Hadiah #{hadiahSekarang.nomorHadiah}
              </CardTitle>
            </CardHeader>
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

          {/* Control & Peserta */}
          <div className="flex flex-col gap-4 flex-1 justify-between max-w-sm w-full">
            <Card className="shadow py-4 bg-red-600 w-full">
              <CardHeader className="pt-4">
                <CardTitle className="text-center text-lg text-white">
                  Peserta Saat Ini
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
                ⏳ {timeLeft} detik
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-2 border-red-600 text-red-600"
                  onClick={nextHadiah}
                  disabled={
                    hadiahSekarang.status !== "sudah" ||
                    currentIndex >= hadiahList.length - 1 ||
                    allHadiahSelesai
                  }
                >
                  Next Hadiah
                </Button>
                <Button
                  onClick={startDraw}
                  variant={"destructive"}
                  disabled={running || hadiahSekarang.status === "sudah"}
                >
                  {running ? "Mengundi..." : "Draw"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardContent className="lg:w-full p-6 border-2 border-red-600 rounded-md">
          <div className="flex justify-between">

          <h2 className="text-lg font-bold mb-4 text-red-500">
            Daftar Pemenang
          </h2>
          <Button
  variant="destructive"
  onClick={() => {
    if (confirm("Yakin ingin mereset semua pemenang?")) {
      resetUndian();
    }
  }}
>
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
          <Card className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
            <div className="bg-white flex items-center justify-center border border-lg p-6">
              <Image
                src={hadiahSekarang.gambar}
                alt={hadiahSekarang.hadiah}
                width={250}
                height={250}
                className="rounded-lg  "
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
          <Button
            className="mt-6 flex w-full "
            variant={"destructive"}
            onClick={submitWinner}
          >
            Submit
          </Button>
        </DialogContent>
      </Dialog>

      {/* Tabel Pemenang */}
    </main>
  );
}
