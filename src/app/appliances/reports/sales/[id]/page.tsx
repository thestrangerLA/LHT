
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getApplianceSale } from '@/services/applianceSalesService';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

export default function SaleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'default') {
      setLoading(true);
      getApplianceSale(id).then(saleData => {
        setSale(saleData);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch sale:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 sm:p-6">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </header>
            <main className="max-w-4xl mx-auto w-full mt-4">
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }
  
  if (id === 'default' || !sale) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>Sale not found</h1>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 sm:p-6">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href="/appliances/reports/sales">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">ກັບໄປໜ້າລາຍງານ</span>
                </Link>
            </Button>
             <div>
                <h1 className="text-xl font-bold tracking-tight">ໃບເກັບເງິນ #{sale.id.substring(0, 7)}</h1>
                <p className="text-xs text-muted-foreground">
                    ວັນທີ: {format(sale.date, 'dd MMMM yyyy')}
                </p>
            </div>
        </header>
        <main className="max-w-4xl mx-auto w-full mt-4">
             <Card>
                <CardHeader>
                    <CardTitle>ລາຍການສິນຄ້າ</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ສິນຄ້າ</TableHead>
                                <TableHead className="text-center">ຈຳນວນ</TableHead>
                                <TableHead className="text-right">ລາຄາຕໍ່ໜ່ວຍ</TableHead>
                                <TableHead className="text-right">ລາຄາລວມ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sale.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold text-lg bg-muted/50">
                                <TableCell colSpan={3} className="text-right">ຍອດລວມທັງໝົດ</TableCell>
                                <TableCell className="text-right">{formatCurrency(sale.subtotal)}</TableCell>
                            </TableRow>
                             <TableRow className="font-bold text-base text-blue-600">
                                <TableCell colSpan={3} className="text-right">ຕົ້ນທຶນ</TableCell>
                                <TableCell className="text-right">{formatCurrency(sale.totalCost || 0)}</TableCell>
                            </TableRow>
                            <TableRow className="font-bold text-base text-green-600">
                                <TableCell colSpan={3} className="text-right">ກຳໄລ</TableCell>
                                <TableCell className="text-right">{formatCurrency(sale.totalProfit || 0)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
