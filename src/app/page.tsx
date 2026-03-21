"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Landmark, FilePieChart, Calculator, FileText, FerrisWheel } from "lucide-react"
import Link from 'next/link'
<<<<<<< HEAD
import { Button } from "@/components/ui/button"


export default function Home() {
=======
import { listenToAccountSummary } from '@/services/accountancyService';
import { listenToTourAccountSummary } from '@/services/tourAccountancyService';
import type { AccountSummary, TourAccountSummary } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

const BusinessCard = ({ title, icon, href, children }: { title: string, icon: React.ReactNode, href: string, children: React.ReactNode }) => (
    <Link href={href}>
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent className="flex-grow">
                {children}
            </CardContent>
        </Card>
    </Link>
);


export default function Home() {
    const [agriSummary, setAgriSummary] = useState<AccountSummary | null>(null);
    const [tourSummary, setTourSummary] = useState<TourAccountSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubAgri = listenToAccountSummary('agriculture', setAgriSummary);
        const unsubTour = listenToTourAccountSummary(setTourSummary);

        // Simple loading state
        const timer = setTimeout(() => setLoading(false), 1500);

        return () => {
            unsubAgri();
            unsubTour();
            clearTimeout(timer);
        };
    }, []);
    
    const agriTotal = useMemo(() => agriSummary ? agriSummary.cash + agriSummary.transfer : 0, [agriSummary]);
    
    const tourTotals = useMemo(() => {
        if (!tourSummary) return { kip: 0, baht: 0, usd: 0, cny: 0 };
        const total = (summary: TourAccountSummary) => ({
            kip: (summary.cash?.kip || 0) + (summary.transfer?.kip || 0),
            baht: (summary.cash?.baht || 0) + (summary.transfer?.baht || 0),
            usd: (summary.cash?.usd || 0) + (summary.transfer?.usd || 0),
            cny: (summary.cash?.cny || 0) + (summary.transfer?.cny || 0),
        });
        return total(tourSummary);
    }, [tourSummary]);


>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-2">
            <FerrisWheel className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">ແດຊ໌ບອດທຸລະກິດທ່ອງທ່ຽວ</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
<<<<<<< HEAD
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
=======
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 w-full max-w-screen-2xl">
            <BusinessCard title="ທຸລະກິດທ່ອງທ່ຽວ" href="/tour" icon={<FerrisWheel className="h-8 w-8 text-primary" />}>
                 {loading ? <Skeleton className="h-24 w-full" /> : tourSummary ? (
                    <div className="space-y-1 text-sm">
                       <p className="font-semibold text-muted-foreground">ຍອດເງິນລວມ:</p>
                       <p>KIP: <span className="font-mono font-semibold">{formatCurrency(tourTotals.kip)}</span></p>
                       <p>THB: <span className="font-mono font-semibold">{formatCurrency(tourTotals.baht)}</span></p>
                       <p>USD: <span className="font-mono font-semibold">{formatCurrency(tourTotals.usd)}</span></p>
                       <p>CNY: <span className="font-mono font-semibold">{formatCurrency(tourTotals.cny)}</span></p>
                    </div>
                ) : <p className="text-muted-foreground">ບໍ່ມີຂໍ້ມູນ</p>}
            </BusinessCard>

            <BusinessCard title="ທຸລະກິດກະສິກຳ" href="/agriculture" icon={<Leaf className="h-8 w-8 text-primary" />}>
                {loading ? <Skeleton className="h-24 w-full" /> : agriSummary ? (
                    <div className="space-y-1 text-sm">
                        <p className="font-semibold text-muted-foreground">ຍອດເງິນລວມ:</p>
                        <p>KIP: <span className="font-mono font-semibold">{formatCurrency(agriTotal)}</span></p>
                    </div>
                ) : <p className="text-muted-foreground">ບໍ່ມີຂໍ້ມູນ</p>}
            </BusinessCard>

            <BusinessCard title="ທຸລະກິດ ເຄື່ອງໃຊ້" href="/appliances" icon={<ShoppingCart className="h-8 w-8 text-primary" />}>
                <p className="text-muted-foreground">ຈັດການຂໍ້ມູນທຸລະກິດເຄື່ອງໃຊ້ທົ່ວໄປ</p>
            </BusinessCard>
            
            <BusinessCard title="ທຸລະກິດ ອາໄຫຼລົດ" href="/autoparts" icon={<Wrench className="h-8 w-8 text-primary" />}>
                <p className="text-muted-foreground">ຈັດການຂໍ້ມູນທຸລະກິດອາໄຫຼລົດ</p>
            </BusinessCard>
            
            <BusinessCard title="Tee" href="/tee" icon={<Briefcase className="h-8 w-8 text-primary" />}>
                <p className="text-muted-foreground">ຈັດການຂໍ້ມູນທຸລະກິດຂອງ Tee</p>
            </BusinessCard>
>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2
        </div>
      </main>
    </div>
  )
}
