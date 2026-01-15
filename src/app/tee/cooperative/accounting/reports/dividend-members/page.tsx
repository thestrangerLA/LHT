
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Calendar as CalendarIcon, Printer, Trash2, PlusCircle, Save } from "lucide-react";
import { listenToCooperativeTransactions } from '@/services/cooperativeAccountingService';
import { defaultAccounts } from '@/services/cooperativeChartOfAccounts';
import { listenToCooperativeMembers } from '@/services/cooperativeMemberService';
import { listenToCooperativeDeposits } from '@/services/cooperativeDepositService';
import type { Transaction, CurrencyValues, CooperativeMember, CooperativeDeposit } from '@/lib/types';
import { getYear, format, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const currencies: (keyof CurrencyValues)[] = ['kip', 'thb', 'usd', 'cny'];
const initialCurrencyValues: CurrencyValues = { kip: 0, thb: 0, usd: 0, cny: 0 };
const SHARE_VALUE_KIP = 100000;
const MEMBER_DIVIDEND_PERCENTAGE = 0.40;

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

type DividendItem = { id: string; name: string; percentage: number };

export default function DividendMembersPage() {
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [members, setMembers] = useState<CooperativeMember[]>([]);
    const [deposits, setDeposits] = useState<CooperativeDeposit[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [exchangeRates, setExchangeRates] = useState({
        thb: 700,
        usd: 25000,
        cny: 3500,
    });

    useEffect(() => {
        const unsubscribeTxs = listenToCooperativeTransactions(setTransactions);
        const unsubscribeMembers = listenToCooperativeMembers(setMembers);
        const unsubscribeDeposits = listenToCooperativeDeposits(setDeposits);
        return () => {
            unsubscribeTxs();
            unsubscribeMembers();
            unsubscribeDeposits();
        };
    }, []);

    const availableYears = useMemo(() => {
        const years = new Set(transactions.map(t => getYear(t.date)));
        const currentYear = new Date().getFullYear();
        years.add(currentYear);
        return Array.from(years).sort((a, b) => b - a);
    }, [transactions]);

    const netProfitInCurrencies = useMemo(() => {
        const yearDate = new Date(selectedYear, 0, 1);
        const startDate = startOfYear(yearDate);
        const endDate = endOfYear(yearDate);

        const filteredTransactions = transactions.filter(tx => isWithinInterval(tx.date, { start: startDate, end: endDate }));

        const totalIncome = { ...initialCurrencyValues };
        const totalExpense = { ...initialCurrencyValues };

        filteredTransactions.forEach(tx => {
            const account = defaultAccounts.find(a => a.id === tx.accountId);
            if (!account) return;
            const multiplier = tx.type === 'debit' ? 1 : -1;
            currencies.forEach(c => {
                 const amount = (tx.amount?.[c] || 0) * multiplier;
                 if (account.type === 'income') totalIncome[c] -= amount;
                else if (account.type === 'expense') totalExpense[c] += amount;
            });
        });
        
        return currencies.reduce((acc, c) => {
            acc[c] = totalIncome[c] - totalExpense[c];
            return acc;
        }, { ...initialCurrencyValues });
    }, [transactions, selectedYear]);

     const totalNetProfitInLak = useMemo(() => {
        return (
            (netProfitInCurrencies.kip || 0) +
            (netProfitInCurrencies.thb || 0) * exchangeRates.thb +
            (netProfitInCurrencies.usd || 0) * exchangeRates.usd +
            (netProfitInCurrencies.cny || 0) * exchangeRates.cny
        );
    }, [netProfitInCurrencies, exchangeRates]);

    const memberData = useMemo(() => {
        const membersWithDeposits = members.map(member => {
            const memberDeposits = deposits.filter(d => d.memberId === member.id);
            const totalDepositKip = (member.deposits?.kip || 0) + memberDeposits.reduce((sum, d) => sum + (d.kip || 0), 0);
            const shares = Math.floor(totalDepositKip / SHARE_VALUE_KIP);
            return { ...member, totalDepositKip, shares };
        });

        const totalShares = membersWithDeposits.reduce((sum, m) => sum + m.shares, 0);
        
        const memberDividendPoolInLak = totalNetProfitInLak * MEMBER_DIVIDEND_PERCENTAGE;

        const dividendPerShareInLak = totalShares > 0 ? memberDividendPoolInLak / totalShares : 0;

        const membersWithDividend = membersWithDeposits.map(m => {
            const dividendInLak = m.shares * dividendPerShareInLak;
            return { ...m, dividendInLak };
        });
        
        return { membersWithDividend, totalShares, memberDividendPoolInLak, dividendPerShareInLak };
    }, [members, deposits, totalNetProfitInLak]);
    
    const handleRateChange = (currency: 'thb' | 'usd' | 'cny', value: string) => {
        setExchangeRates(prev => ({
            ...prev,
            [currency]: Number(value) || 0
        }));
    };


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/tee/cooperative/accounting/reports">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold tracking-tight">ລາຍງານການປັນຜົນໃຫ້ສະມາຊິກ</h1>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 space-y-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>ໂຕກອງ ແລະ ອັດຕາແລກປ່ຽນ</CardTitle>
                        <CardContent className="flex flex-col md:flex-row md:items-end gap-4 pt-4">
                             <div className="grid gap-2">
                                <Label htmlFor="year-selector">ເລືອກປີ</Label>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button id="year-selector" variant="outline" className="w-[200px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedYear ? `ປີ ${selectedYear + 543}` : 'ເລືອກປີ'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {availableYears.map(year => (
                                            <DropdownMenuItem key={year} onSelect={() => setSelectedYear(year)}>
                                                {year + 543}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="grid gap-2">
                                <Label>ອັດຕາແລກປ່ຽນ THB</Label>
                                <Input type="number" value={exchangeRates.thb} onChange={(e) => handleRateChange('thb', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>ອັດຕາແລກປ່ຽນ USD</Label>
                                <Input type="number" value={exchangeRates.usd} onChange={(e) => handleRateChange('usd', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>ອັດຕາແລກປ່ຽນ CNY</Label>
                                <Input type="number" value={exchangeRates.cny} onChange={(e) => handleRateChange('cny', e.target.value)} />
                            </div>
                        </CardContent>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>ການປັນຜົນໃຫ້ສະມາຊິກ ປີ {selectedYear + 543}</CardTitle>
                         <CardDescription>
                            ກຳໄລສຸດທິທັງໝົດຂອງສະຫະກອນໃນປີ {selectedYear + 543}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-sm font-medium text-muted-foreground">ກຳໄລສຸດທິລວມ (LAK)</h4>
                            <p className={`text-2xl font-bold ${totalNetProfitInLak < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {formatCurrency(totalNetProfitInLak)}
                            </p>
                        </div>
                       
                        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                            <h3 className="font-semibold text-blue-800">ກຳໄລສ່ວນຂອງສະມາຊິກ (40%)</h3>
                             <div className="text-lg font-bold text-blue-700">
                                {formatCurrency(memberData.memberDividendPoolInLak)} LAK
                            </div>
                        </div>
                         <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                            <h3 className="font-semibold text-amber-800">ເງິນປັນຜົນຕໍ່ຫຸ້ນ</h3>
                             <div className="text-lg font-bold text-amber-700">
                                {formatCurrency(memberData.dividendPerShareInLak)} LAK
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">ຄຳນວນຈາກ: ຍອດເງິນປັນຜົນສະມາຊິກ / ຈຳນວນຫຸ້ນທັງໝົດ ({memberData.totalShares} ຫຸ້ນ)</p>
                        </div>

                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ລະຫັດ</TableHead>
                                <TableHead>ຊື່ສະມາຊິກ</TableHead>
                                <TableHead className="text-right">ເງິນຝາກ (KIP)</TableHead>
                                <TableHead className="text-right">ຈຳນວນຫຸ້ນ</TableHead>
                                <TableHead className="text-right">ປັນຜົນ (LAK)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {memberData.membersWithDividend.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-mono">{member.memberId}</TableCell>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(member.totalDepositKip)}</TableCell>
                                    <TableCell className="text-right font-bold">{member.shares}</TableCell>
                                    <TableCell className="text-right font-mono text-green-600">
                                        {formatCurrency(member.dividendInLak)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-muted font-bold">
                                <TableCell colSpan={3} className="text-right">ລວມທັງໝົດ</TableCell>
                                <TableCell className="text-right">{memberData.totalShares}</TableCell>
                                <TableCell className="text-right font-mono text-green-700">
                                    {formatCurrency(memberData.memberDividendPoolInLak)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                      </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

    