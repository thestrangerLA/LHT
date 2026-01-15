

"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, MoreHorizontal, ChevronDown, Banknote, Clock, AlertTriangle, FileText, Search } from "lucide-react";
import { format, getYear } from 'date-fns';
import type { Loan, CooperativeMember, LoanRepayment, CurrencyValues } from '@/lib/types';
import { listenToCooperativeLoans, deleteLoan, listenToAllRepayments } from '@/services/cooperativeLoanService';
import { listenToCooperativeMembers } from '@/services/cooperativeMemberService';
import { Badge } from '@/components/ui/badge';
import { useClientRouter } from '@/hooks/useClientRouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

const initialCurrencyValues: Omit<CurrencyValues, 'cny'> = { kip: 0, thb: 0, usd: 0 };
const currencies: (keyof Omit<CurrencyValues, 'cny'>)[] = ['kip', 'thb', 'usd'];

const SummaryStatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
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

const CurrencySummaryCard = ({ title, balance, currency, isActive, onClick }: { title: string, balance: number, currency: string, isActive: boolean, onClick: () => void }) => (
    <Card 
        className={cn(
            "cursor-pointer transition-all",
            isActive ? "ring-2 ring-primary shadow-lg" : "hover:bg-muted/50"
        )}
        onClick={onClick}
    >
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="text-2xl font-bold">
                {formatCurrency(balance)} <span className="text-xs text-muted-foreground">{currency.toUpperCase()}</span>
            </div>
        </CardContent>
    </Card>
);


export default function CooperativeLoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
    const [members, setMembers] = useState<CooperativeMember[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useClientRouter();
    const { toast } = useToast();
    
    const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
    const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'KIP' | 'THB' | 'USD'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');


    useEffect(() => {
        const unsubscribeLoans = listenToCooperativeLoans(setLoans, () => setLoading(false));
        const unsubscribeMembers = listenToCooperativeMembers(setMembers);
        const unsubscribeRepayments = listenToAllRepayments(setRepayments);
        return () => {
            unsubscribeLoans();
            unsubscribeMembers();
            unsubscribeRepayments();
        };
    }, []);
    
    const availableYears = useMemo(() => {
        const years = new Set(loans.map(l => getYear(l.applicationDate)));
        return Array.from(years).sort((a, b) => b - a);
    }, [loans]);

    const memberMap = useMemo(() => {
        return members.reduce((acc, member) => {
            acc[member.id] = member.name;
            return acc;
        }, {} as Record<string, string>);
    }, [members]);

    const loansWithDetails = useMemo(() => {
        const filteredByYear = loans.filter(loan => {
            if (!selectedYear) return true;
            return getYear(loan.applicationDate) === selectedYear;
        });
        
        const filteredByCurrency = currencyFilter === 'ALL'
            ? filteredByYear
            : filteredByYear.filter(loan => (loan.amount[currencyFilter.toLowerCase() as keyof Loan['amount']] || 0) > 0);

        const filteredByName = filteredByCurrency.filter(loan => {
            if (!searchQuery) return true;
            const borrowerName = loan.memberId ? memberMap[loan.memberId] : loan.debtorName;
            return borrowerName?.toLowerCase().includes(searchQuery.toLowerCase());
        });

        return filteredByName.map(loan => {
            const loanRepayments = repayments.filter(r => r.loanId === loan.id);
            
            const totalPaid: Omit<CurrencyValues, 'cny'> = { ...initialCurrencyValues };
            const outstandingBalance: Omit<CurrencyValues, 'cny'> = { ...initialCurrencyValues };
            const profit: Omit<CurrencyValues, 'cny'> = { ...initialCurrencyValues };

            currencies.forEach(c => {
                const totalToRepay = loan.repaymentAmount[c] || 0;
                
                totalPaid[c] = loanRepayments.reduce((sum, r) => sum + (r.amountPaid?.[c] || 0), 0);
                outstandingBalance[c] = totalToRepay - totalPaid[c];
                
                // Profit is the difference between what's to be repaid and the principal
                profit[c] = totalToRepay - (loan.amount[c] || 0);
            });
            
            const totalOutstanding = currencies.reduce((sum, c) => sum + outstandingBalance[c], 0);
            let calculatedStatus: 'ຈ່າຍໝົດແລ້ວ' | 'ຍັງຄ້າງ' | 'ລໍການອະນຸມັດ' = 'ຍັງຄ້າງ';
            if (loan.status === 'pending') {
                calculatedStatus = 'ລໍການອະນຸມັດ';
            } else if (totalOutstanding <= 0.01) {
                calculatedStatus = 'ຈ່າຍໝົດແລ້ວ';
            }


            return { ...loan, totalPaid, outstandingBalance, profit, calculatedStatus };
        });
    }, [loans, repayments, selectedYear, currencyFilter, searchQuery, memberMap]);

    const summary = useMemo(() => {
        const totalLoanCount = loansWithDetails.length;
        const pendingCount = loansWithDetails.filter(l => l.status === 'pending').length;
        const overdueCount = loansWithDetails.filter(l => l.calculatedStatus === 'ຍັງຄ້າງ').length;
        
        const totalOutstanding = loansWithDetails.reduce((acc, loan) => {
            if (loan.calculatedStatus === 'ຍັງຄ້າງ') {
                 currencies.forEach(c => {
                     acc[c] += loan.outstandingBalance[c] || 0;
                 });
            }
            return acc;
        }, { ...initialCurrencyValues });


        return { totalLoanCount, pendingCount, overdueCount, totalOutstanding };
    }, [loansWithDetails]);


    const handleRowClick = (loanId: string) => {
        router.push(`/tee/cooperative/loans/${loanId}`);
    };
    
    const handleDeleteClick = (e: React.MouseEvent, loan: Loan) => {
        e.stopPropagation();
        setLoanToDelete(loan);
    };

    const confirmDelete = async () => {
        if (!loanToDelete) return;
        try {
            await deleteLoan(loanToDelete.id);
            toast({
                title: "ລົບສິນເຊື່ອສຳເລັດ",
                description: `ສິນເຊື່ອລະຫັດ ${loanToDelete.loanCode} ໄດ້ຖືກລົບອອກແລ້ວ.`,
            });
        } catch (error) {
            console.error("Error deleting loan:", error);
            toast({
                title: "ເກີດຂໍ້ຜິດພາດ",
                description: "ບໍ່ສາມາດລົບສິນເຊື່ອໄດ້.",
                variant: "destructive",
            });
        } finally {
            setLoanToDelete(null);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/tee/cooperative">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">ລະບົບສິນເຊື່ອສະຫະກອນ</h1>
                <div className="ml-auto flex items-center gap-2">
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="ຄົ້ນຫາຊື່ຜູ້ກູ້ຢືມ..."
                            className="pl-8 sm:w-[200px] lg:w-[250px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <span>{selectedYear ? `ປີ ${selectedYear + 543}` : 'ທຸກໆປີ'}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedYear(null)}>ທຸກໆປີ</DropdownMenuItem>
                            {availableYears.map(year => (
                                <DropdownMenuItem key={year} onClick={() => setSelectedYear(year)}>
                                    ປີ {year + 543}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" asChild>
                        <Link href="/tee/cooperative/loans/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            ສ້າງຄຳຮ້ອງສິນເຊື່ອ
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                    <SummaryStatCard title="ສັນຍາທັງໝົດ" value={String(summary.totalLoanCount)} icon={<FileText className="h-4 w-4 text-muted-foreground" />}/>
                    <SummaryStatCard title="ລໍການອະນຸມັດ" value={String(summary.pendingCount)} icon={<Clock className="h-4 w-4 text-muted-foreground" />}/>
                    <SummaryStatCard title="ໜີ້ຄ້າງຊຳລະ" value={String(summary.overdueCount)} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}/>
                    <CurrencySummaryCard title="ຍອດຄ້າງ (KIP)" balance={summary.totalOutstanding.kip} currency="KIP" isActive={currencyFilter === 'KIP'} onClick={() => setCurrencyFilter('KIP')} />
                    <CurrencySummaryCard title="ຍອດຄ້າງ (THB)" balance={summary.totalOutstanding.thb} currency="THB" isActive={currencyFilter === 'THB'} onClick={() => setCurrencyFilter('THB')} />
                    <CurrencySummaryCard title="ຍອດຄ້າງ (USD)" balance={summary.totalOutstanding.usd} currency="USD" isActive={currencyFilter === 'USD'} onClick={() => setCurrencyFilter('USD')} />
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>ລາຍການສິນເຊື່ອທັງໝົດ</CardTitle>
                            {currencyFilter !== 'ALL' && (
                                <Button variant="ghost" onClick={() => setCurrencyFilter('ALL')}>ສະແດງທັງໝົດ</Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ລະຫັດ/ຊື່</TableHead>
                                    {(currencyFilter === 'ALL' || currencyFilter === 'KIP') && <TableHead className="text-right">ເງິນຕົ້ນ (KIP)</TableHead>}
                                    {(currencyFilter === 'ALL' || currencyFilter === 'KIP') && <TableHead className="text-right">ຄ້າງ (KIP)</TableHead>}
                                    {(currencyFilter === 'ALL' || currencyFilter === 'THB') && <TableHead className="text-right">ເງິນຕົ້ນ (THB)</TableHead>}
                                    {(currencyFilter === 'ALL' || currencyFilter === 'THB') && <TableHead className="text-right">ຄ້າງ (THB)</TableHead>}
                                    {(currencyFilter === 'ALL' || currencyFilter === 'USD') && <TableHead className="text-right">ເງິນຕົ້ນ (USD)</TableHead>}
                                    {(currencyFilter === 'ALL' || currencyFilter === 'USD') && <TableHead className="text-right">ຄ້າງ (USD)</TableHead>}
                                    <TableHead className="text-right">ກຳໄລ</TableHead>
                                    <TableHead>ວັນທີ</TableHead>
                                    <TableHead>ສະຖານະ</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={10} className="text-center h-24">ກຳລັງໂຫລດ...</TableCell></TableRow>
                                ) : loansWithDetails.length > 0 ? (
                                    loansWithDetails.map(loan => (
                                        <TableRow key={loan.id} onClick={() => handleRowClick(loan.id)} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell>
                                                <div className="font-mono">{loan.loanCode}</div>
                                                <div>{loan.memberId ? memberMap[loan.memberId] : loan.debtorName || 'N/A'}</div>
                                            </TableCell>
                                            {(currencyFilter === 'ALL' || currencyFilter === 'KIP') && <TableCell className="text-right font-mono">{formatCurrency(loan.amount.kip || 0)}</TableCell>}
                                            {(currencyFilter === 'ALL' || currencyFilter === 'KIP') && <TableCell className="text-right font-mono text-red-600">{formatCurrency(loan.outstandingBalance.kip || 0)}</TableCell>}
                                            {(currencyFilter === 'ALL' || currencyFilter === 'THB') && <TableCell className="text-right font-mono">{formatCurrency(loan.amount.thb || 0)}</TableCell>}
                                            {(currencyFilter === 'ALL' || currencyFilter === 'THB') && <TableCell className="text-right font-mono text-red-600">{formatCurrency(loan.outstandingBalance.thb || 0)}</TableCell>}
                                            {(currencyFilter === 'ALL' || currencyFilter === 'USD') && <TableCell className="text-right font-mono">{formatCurrency(loan.amount.usd || 0)}</TableCell>}
                                            {(currencyFilter === 'ALL' || currencyFilter === 'USD') && <TableCell className="text-right font-mono text-red-600">{formatCurrency(loan.outstandingBalance.usd || 0)}</TableCell>}
                                            <TableCell className="text-right text-blue-500">
                                                {currencies.map(c => {
                                                    const amount = loan.profit[c] || 0;
                                                    return (loan.amount?.[c] || 0) > 0 ? <div key={c}>{formatCurrency(amount)} {c.toUpperCase()}</div> : null;
                                                })}
                                            </TableCell>
                                            <TableCell>{format(loan.applicationDate, 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>
                                                <Badge variant={loan.calculatedStatus === 'ຈ່າຍໝົດແລ້ວ' ? 'success' : (loan.calculatedStatus === 'ລໍການອະນຸມັດ' ? 'outline' : 'warning')}>
                                                    {loan.calculatedStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>ການດຳເນີນການ</DropdownMenuLabel>
                                                        <DropdownMenuItem 
                                                            className="text-red-500"
                                                            onClick={(e) => handleDeleteClick(e, loan)}
                                                        >
                                                            ລົບ
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={10} className="text-center h-24">ບໍ່ມີຂໍ້ມູນສິນເຊື່ອ</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
            <AlertDialog open={!!loanToDelete} onOpenChange={(open) => !open && setLoanToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ຢືນยันການລົບ</AlertDialogTitle>
                        <AlertDialogDescription>
                            ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລົບສິນເຊື່ອລະຫັດ "{loanToDelete?.loanCode}" ຂອງ "{loanToDelete?.memberId ? memberMap[loanToDelete.memberId] : loanToDelete?.debtorName}"? 
                            ການກະທຳນີ້ຈະລົບຂໍ້ມູນການຊຳລະຄືນທັງໝົດທີ່ກ່ຽວຂ້ອງ ແລະ ບໍ່ສາມາດย้อนกลับໄດ້.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>ຍົກເລີກ</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>ຢືນຢັນ</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

