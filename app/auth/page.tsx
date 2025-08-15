'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState } from "react";
import { Icons } from "@/components/ui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAlamat, setSelectedAlamat] = useState<string>("Alamat");

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }

  return (
    <main className="flex w-full justify-center items-center ">
      <Card className="mx-auto bg-neutral-white max-w-3xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden border border-sm">
        <div className="bg-red-600 text-black flex flex-col p-10 justify-between">
          <Image
            src={"/logo.png"}
            alt={"logo HUT 80"}
            width={400}
            height={400}
            className="rounded-lg object-cover  p-4 w-full h-auto"
          />
          <blockquote className="leading-normal text-white text-balance mt-8">
            &ldquo;Kemerdekaan adalah hak segala bangsa untuk mengatur diri dan nasibnya sendiri.&rdquo; - Ki Hajar Dewantara
          </blockquote>
        </div>

        <CardContent className="  flex flex-col justify-center p-8">
          <div className="my-6 text-red-600 text-center">
            <h1 className="font-bold text-2xl ">Registrasi Undian</h1>
            <p className="text-sm"> Lorem ipsum dolor sit amet.</p>
          </div>
          <form onSubmit={onSubmit}>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label htmlFor="nama" className="sr-only">
                  Nama
                </Label>
                <Input
                  id="nama"
                  placeholder="Masukan nama"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className="border px-4 py-2 rounded-md w-full text-left">
                    {selectedAlamat}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[...Array(9)].map((_, i) => (
                      <DropdownMenuItem
                        key={i}
                        onSelect={() =>
                          setSelectedAlamat(`Jalan Asri No. ${i + 1}`)
                        }
                      >
                        Jalan Asri No. {i + 1}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Input
                  placeholder="No. Jalan"
                  type="number"
                  className="w-24"
                  disabled={isLoading}
                />
              </div>

              <Button variant={"destructive"} disabled={isLoading}>
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
