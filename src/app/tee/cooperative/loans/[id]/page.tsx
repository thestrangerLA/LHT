
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, Percent, Landmark } from "lucide-react";
import { format } from "date-fns";
import type { Loan, CurrencyValues } from '@/lib/types';
import { listenToLoan, listenToRepaymentsForLoan } from '@/services/cooperativeLoanService';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const currencies: (keyof CurrencyValues)[] = ['kip', 'thb', 'usd'];

export default function LoanDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [loan, setLoan] = useState<Loan | null>(null);
    const [repayments, setRepayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!id) return;

        const unsubscribeLoan = listenToLoan(id, (loanData) => {
            if (loanData) {
                setLoan(loanData);
            }
            setLoading(false);
        });

        const unsubscribeRepayments = listenToRepaymentsForLoan(id, setRepayments);
        
        return () => {
            unsubscribeLoan();
            unsubscribeRepayments();
        };
    }, [id]);

     const { totalPaid, outstandingBalance } = useMemo(() => {
        if (!loan) return { totalPaid: { kip: 0, thb: 0, usd: 0 }, outstandingBalance: { kip: 0, thb: 0, usd: 0 } };
        
        const totalPaid = repayments.reduce((sum, r) => {
            currencies.forEach(c => {
                 sum[c] += r.amountPaid?.[c] || 0;
            });
            return sum;
        }, { kip: 0, thb: 0, usd: 0 });

        const outstandingBalance = { kip: 0, thb: 0, usd: 0 };
        currencies.forEach(c => {
            const totalLoanAmountWithInterest = (loan.amount[c] || 0) * (1 + (loan.interestRate || 0) / 100);
            outstandingBalance[c] = totalLoanAmountWithInterest - totalPaid[c];
        });

        return { totalPaid, outstandingBalance };
    }, [repayments, loan]);


    if (loading) {
        return <div className="text-center p-8">Loading loan details...</div>;
    }

    if (!loan) {
        return <div className="text-center p-8">Loan not found.</div>;
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/tee/cooperative/loans">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">ລາຍລະອຽດສິນເຊື່ອ: {loan.loanCode}</h1>
                 <div className="ml-auto">
                    <Badge variant={loan.status === 'paid_off' ? 'default' : 'secondary'}>{loan.status}</Badge>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {currencies.map(c => {
                        const amount = loan.amount[c] || 0;
                        if (amount === 0) return null;
                        return <StatCard key={c} title={`ເງິນກູ້ຢືມ (${c.toUpperCase()})`} value={`${formatCurrency(amount)}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                    })}
                    <StatCard title="%ດອກເບ້ຍ" value={`${loan.interestRate}% / ປີ`} icon={<Percent className="h-4 w-4 text-muted-foreground" />} />
                    {currencies.map(c => {
                        const amount = outstandingBalance[c];
                        if (loan.amount[c] === 0 && amount === 0) return null;
                        return <StatCard key={c} title={`ຍອດຄ້າງຊຳລະ (${c.toUpperCase()})`} value={`${formatCurrency(amount)}`} icon={<Landmark className="h-4 w-4 text-muted-foreground" />} />
                    })}
                </div>
            </main>
        </div>
    );
}

