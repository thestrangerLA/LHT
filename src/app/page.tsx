"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Landmark, FilePieChart, Calculator, FileText, FerrisWheel } from "lucide-react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"


export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-2">
            <FerrisWheel className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">ແດຊ໌ບອດທຸລະກິດທ່ອງທ່ຽວ</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
          <Link href="/tour/accountancy">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ຈັດການບັນຊີ</CardTitle>
                <Landmark className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ຕິດຕາມລາຍຮັບ-ລາຍຈ່າຍ, ຈັດການທຸລະກຳ, ແລະເບິ່ງສະຫຼຸບພາບລວມການເງິນ
                </p>
              </CardContent>
            </Card>
          </Link>
           <Link href="/tour-programs">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ໂປຣແກຣມທົວ</CardTitle>
                <FileText className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ຈັດການ, ສ້າງ ແລະ ແກ້ໄຂໂປຣແກຣມທົວສຳລັບລູກຄ້າ
                </p>
              </CardContent>
            </Card>
          </Link>
           <Link href="/tour/reports">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ສະຫຼຸບຍອດ</CardTitle>
                <FilePieChart className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ເບິ່ງສະຫຼຸບຜົນປະກອບການ ແລະ ກຳໄລ-ຂາດທຶນຂອງແຕ່ລະໂປຣແກຣມທົວ
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/tour/cost-calculator">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ຄຳນວນຕົ້ນທຶນ</CardTitle>
                <Calculator className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ເຄື່ອງມືຊ່ວຍຄຳນວນຕົ້ນທຶນໂປຣແກຣມທົວ
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
