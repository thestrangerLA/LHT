

"use client"

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, ArrowLeft, HandCoins, PlusCircle, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { listenToAutoPartsCodEntries, addAutoPartsCodEntry, updateAutoPartsCodEntry, deleteAutoPartsCodEntry } from '@/services/autoPartsCodService';
import type { CodEntry } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, isWithinInterval, startOfMonth, endOfMonth, getMonth, setMonth, getYear } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
}

const CodCompanyTable = ({ company, title, entries, onUpdateEntry, onDeleteEntry }: {
    company: 'ANS' | 'HAL' | 'MX' | 'NH',
    title: string,
    entries: CodEntry[],
    onUpdateEntry: (id: string, field: keyof CodEntry, value: any) => void,
    onDeleteEntry: (id: string) => void
}) => {
     const summary = useMemo(() => {
        const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
        const collected = entries.filter(e => e.type === 'collected').reduce((sum, e) => sum + e.amount, 0);
        const pending = entries.filter(e => e.type === 'pending').reduce((sum, e) => sum + e.amount, 0);
        const returned = entries.filter(e => e.type === 'returned').reduce((sum, e) => sum + e.amount, 0);
        const paidToOffice = entries.filter(e => e.isPaidToOffice).reduce((sum, e) => sum + e.amount, 0);
        const dueToOffice = collected - paidToOffice;

        return { totalAmount, collected, pending, returned, paidToOffice, dueToOffice };
    }, [entries]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="sr-only">{title}</CardTitle>
                 <CardDescription className="flex flex-wrap items-center gap-x-4 text-xs">
                    <span>ລວມ: {formatCurrency(summary.totalAmount)}</span>
                    <span className="text-green-600">ເກັບເງິນສຳເລັດ: {formatCurrency(summary.collected)}</span>
                    <span className="text-yellow-600">ຄ້າງ: {formatCurrency(summary.pending)}</span>
                    <span className="text-orange-600">ຕີຄືນ: {formatCurrency(summary.returned)}</span>
                    <span className="font-bold">ມອບແລ້ວ: {formatCurrency(summary.paidToOffice)}</span>
                    <span className="font-bold text-red-600">ຄ້າງມອບ: {formatCurrency(summary.dueToOffice)}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ວັນທີ</TableHead>
                            <TableHead>ລູກຄ້າ</TableHead>
                            <TableHead className="text-right">ຈຳນວນເງິນ</TableHead>
                            <TableHead className="text-center">ສະຖານະ</TableHead>
                            <TableHead className="text-center">ມອບເງິນ Office</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map(entry => (
                            <TableRow key={entry.id} className={entry.isPaidToOffice ? 'bg-green-50/50' : ''}>
                                <TableCell>{format(entry.date, 'dd/MM/yy')}</TableCell>
                                <TableCell>{entry.customerName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(entry.amount)}</TableCell>
                                <TableCell className="text-center">
                                    <Select value={entry.type} onValueChange={(v) => onUpdateEntry(entry.id, 'type', v)}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending"><Badge variant="secondary">ຄ້າງ</Badge></SelectItem>
                                            <SelectItem value="collected"><Badge className="bg-green-500">ສຳເລັດ</Badge></SelectItem>
                                            <SelectItem value="returned"><Badge variant="destructive">ຄືນ</Badge></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Checkbox checked={entry.isPaidToOffice} onCheckedChange={c => onUpdateEntry(entry.id, 'isPaidToOffice', c)} />
                                </TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => onDeleteEntry(entry.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {entries.length === 0 && <div className="text-center p-8 text-muted-foreground">ບໍ່ມີລາຍການ</div>}
            </CardContent>
        </Card>
    );
}

export default function AutoPartsCodPage() {
    const { toast } = useToast();
    const [allEntries, setAllEntries] = useState<CodEntry[]>([]);
    const [displayMonth, setDisplayMonth] = useState<Date>(new Date());
    const [newEntry, setNewEntry] = useState<Partial<Omit<CodEntry, 'id' | 'createdAt'>>>({
        date: undefined,
        company: 'ANS',
        type: 'pending',
        customerName: '',
        description: '',
        amount: 0,
    });
    
    useEffect(() => {
        setNewEntry(prev => ({ ...prev, date: new Date() }));
        const unsubscribe = listenToAutoPartsCodEntries(setAllEntries);
        return () => unsubscribe();
    }, []);

    const filteredEntries = useMemo(() => {
        const start = startOfMonth(displayMonth);
        const end = endOfMonth(displayMonth);
        return allEntries.filter(entry => isWithinInterval(entry.date, { start, end }));
    }, [allEntries, displayMonth]);
    
    const ansEntries = useMemo(() => filteredEntries.filter(e => e.company === 'ANS'), [filteredEntries]);
    const halEntries = useMemo(() => filteredEntries.filter(e => e.company === 'HAL'), [filteredEntries]);
    const mxEntries = useMemo(() => filteredEntries.filter(e => e.company === 'MX'), [filteredEntries]);
    const nhEntries = useMemo(() => filteredEntries.filter(e => e.company === 'NH'), [filteredEntries]);
    
    const handleAddEntry = async () => {
        if (!newEntry.date || !newEntry.customerName || !newEntry.amount || !newEntry.company) {
            toast({title: 'ຂໍ້ມູນບໍ່ຄົບ', description: 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ', variant: 'destructive'});
            return;
        }
        try {
            await addAutoPartsCodEntry({
                date: startOfDay(newEntry.date),
                company: newEntry.company,
                type: 'pending',
                customerName: newEntry.customerName,
                description: newEntry.description || '',
                amount: newEntry.amount,
            });
            toast({title: 'ເພີ່ມລາຍການ COD ສຳເລັດ'});
            setNewEntry({ date: new Date(), company: 'ANS', type: 'pending', customerName: '', description: '', amount: 0 });
        } catch (e) {
            toast({title: 'ເກີດຂໍ້ຜິດພາດ', variant: 'destructive'});
        }
    };

    const handleUpdateEntry = (id: string, field: keyof CodEntry, value: any) => {
        updateAutoPartsCodEntry(id, {[field]: value});
    };
    
    const handleDeleteEntry = (id: string) => {
        if (window.confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້?')) {
            deleteAutoPartsCodEntry(id).then(() => toast({title: 'ລຶບລາຍການສຳເລັດ'}));
        }
    };

    const MonthYearSelector = () => {
        const years = Array.from({ length: 3 }, (_, i) => getYear(new Date()) - 1 + i);
        const months = Array.from({ length: 12 }, (_, i) => setMonth(new Date(), i));

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                        {format(displayMonth, "LLLL yyyy")}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {years.map(year => (
                         <DropdownMenuSub key={year}>
                            <DropdownMenuSubTrigger>
                                <span>{year + 543}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {months.map(month => (
                                        <DropdownMenuItem 
                                            key={getMonth(month)} 
                                            onClick={() => {
                                                const newDate = new Date(year, getMonth(month), 1);
                                                setDisplayMonth(newDate);
                                            }}
                                        >
                                            {format(month, "LLLL")}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                             </DropdownMenuPortal>
                        </DropdownMenuSub>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/autoparts">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <HandCoins className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold tracking-tight">ລະບົບ COD (ອາໄຫຼລົດ)</h1>
                </div>
                 <div className="ml-auto">
                    <MonthYearSelector />
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:grid md:grid-cols-3 md:gap-8">
                <div className="md:col-span-1 flex flex-col gap-4">
                     <Card>
                        <CardHeader><CardTitle>ເພີ່ມລາຍການໃໝ່</CardTitle></CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>ວັນທີ</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newEntry.date ? format(newEntry.date, "PPP") : <span>ເລືອກວັນທີ</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newEntry.date} onSelect={(d) => setNewEntry(p => ({...p, date: d}))} initialFocus/></PopoverContent>
                                </Popover>
                            </div>
                             <div className="grid gap-2">
                                <Label>ບໍລິສັດຂົນສົ່ງ</Label>
                                <Select value={newEntry.company} onValueChange={v => setNewEntry(p => ({...p, company: v as 'ANS' | 'HAL' | 'MX' | 'NH'}))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ANS">ANS</SelectItem>
                                        <SelectItem value="HAL">HAL</SelectItem>
                                        <SelectItem value="MX">MX</SelectItem>
                                        <SelectItem value="NH">NH</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2"><Label>ຊື່ລູກຄ້າ</Label><Input value={newEntry.customerName} onChange={e => setNewEntry(p => ({...p, customerName: e.target.value}))} /></div>
                            <div className="grid gap-2"><Label>ລາຍລະອຽດ</Label><Input value={newEntry.description} onChange={e => setNewEntry(p => ({...p, description: e.target.value}))} /></div>
                            <div className="grid gap-2"><Label>ຈຳນວນເງິນ</Label><Input type="number" value={newEntry.amount || ''} onChange={e => setNewEntry(p => ({...p, amount: Number(e.target.value)}))} /></div>
                            <Button onClick={handleAddEntry}><PlusCircle className="mr-2 h-4 w-4"/>ເພີ່ມລາຍການ</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 mt-4 md:mt-0">
                    <Accordion type="single" collapsible defaultValue="item-ans" className="w-full space-y-4">
                        <AccordionItem value="item-ans" className="border-none">
                            <AccordionTrigger className="text-lg font-bold bg-blue-50 hover:bg-blue-100 px-4 rounded-md hover:no-underline">ANS</AccordionTrigger>
                            <AccordionContent className="p-1">
                                <CodCompanyTable company="ANS" title="ANS" entries={ansEntries} onUpdateEntry={handleUpdateEntry} onDeleteEntry={handleDeleteEntry} />
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-hal" className="border-none">
                            <AccordionTrigger className="text-lg font-bold bg-green-50 hover:bg-green-100 px-4 rounded-md hover:no-underline">HAL</AccordionTrigger>
                            <AccordionContent className="p-1">
                                 <CodCompanyTable company="HAL" title="HAL" entries={halEntries} onUpdateEntry={handleUpdateEntry} onDeleteEntry={handleDeleteEntry} />
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-mx" className="border-none">
                            <AccordionTrigger className="text-lg font-bold bg-orange-50 hover:bg-orange-100 px-4 rounded-md hover:no-underline">MX</AccordionTrigger>
                            <AccordionContent className="p-1">
                                 <CodCompanyTable company="MX" title="MX" entries={mxEntries} onUpdateEntry={handleUpdateEntry} onDeleteEntry={handleDeleteEntry} />
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-nh" className="border-none">
                            <AccordionTrigger className="text-lg font-bold bg-purple-50 hover:bg-purple-100 px-4 rounded-md hover:no-underline">NH</AccordionTrigger>
                            <AccordionContent className="p-1">
                                 <CodCompanyTable company="NH" title="NH" entries={nhEntries} onUpdateEntry={handleUpdateEntry} onDeleteEntry={handleDeleteEntry} />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </main>
        </div>
    );
}
