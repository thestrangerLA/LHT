
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FerrisWheel } from "lucide-react"
import Link from 'next/link'
import { listenToTourAccountSummary } from '@/services/tourAccountancyService';
import type { TourAccountSummary } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

const BusinessCard = ({ title, icon, href, children }: { title: string, icon: React.ReactNode, href: string, children: React.ReactNode }) => (
    <Link href={href}>
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col w-full max-w-sm">
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
    const [tourSummary, setTourSummary] = useState<TourAccountSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubTour = listenToTourAccountSummary(setTourSummary);

        const timer = setTimeout(() => setLoading(false), 1500);

        return () => {
            unsubTour();
            clearTimeout(timer);
        };
    }, []);
    
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-2">
            <FerrisWheel className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">ແດຊ໌ບອດທຸລະກິດທ່ອງທ່ຽວ</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4">
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
      </main>
    </div>
  )
}
