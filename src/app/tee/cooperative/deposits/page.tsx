
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay } from "date-fns";
import { ArrowLeft, PiggyBank, Calendar as CalendarIcon, Trash2, PlusCircle, MoreHorizontal, Check, ChevronsUpDown } from "lucide-react";
import type { CooperativeMember, CooperativeDeposit } from '@/lib/types';
import { listenToCooperativeMembers } from '@/services/cooperativeMemberService';
import { listenToCooperativeDeposits, addCooperativeDeposit, deleteCooperativeDeposit } from '@/services/cooperativeDepositService';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

const AddDepositDialog = ({ members, onAddDeposit }: { members: CooperativeMember[], onAddDeposit: (deposit: Omit<CooperativeDeposit, 'id'|'createdAt'>) => Promise<void> }) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [depositDate, setDepositDate] = useState<Date | undefined>(new Date());
    const [amount, setAmount] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedMember = members.find(m => m.id === selectedMemberId);
        if (!selectedMember || !depositDate || amount <= 0) {
            toast({ title: "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ", description: "ກະລຸນາເລືອກສະມາຊິກ, ວັນທີ ແລະ ປ້ອນຈຳນວນເງິນ", variant: "destructive" });
            return;
        }

        try {
            await onAddDeposit({
                memberId: selectedMember.id,
                memberName: selectedMember.name,
                date: startOfDay(depositDate),
                amount: amount,
            });
            toast({ title: "ບັນທຶກເງິນຝາກສຳເລັດ" });
            setOpen(false);
            setSelectedMemberId('');
            setDepositDate(new Date());
            setAmount(0);
        } catch (error) {
            console.error("Error adding deposit:", error);
            toast({ title: "ເກີດຂໍ້ຜິດພາດ", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມລາຍການຝາກ</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ບັນທຶກເງິນຝາກສະມາຊິກ</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>ສະມາຊິກ</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                    {selectedMemberId ? members.find(m => m.id === selectedMemberId)?.name : "ເລືອກສະມາຊິກ..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="ຄົ້ນຫາສະມາຊິກ..." />
                                    <CommandEmpty>ບໍ່ພົບສະມາຊິກ.</CommandEmpty>
                                    <CommandGroup>
                                        {members.map((member) => (
                                            <CommandItem
                                                key={member.id}
                                                value={member.name}
                                                onSelect={() => {
                                                    setSelectedMemberId(member.id);
                                                    setOpen(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedMemberId === member.id ? "opacity-100" : "opacity-0")} />
                                                {member.name} ({member.memberId})
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label>ວັນທີຝາກ</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {depositDate ? format(depositDate, "PPP") : <span>ເລືອກວັນທີ</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={depositDate} onSelect={setDepositDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid gap-2">
                        <Label>ຈຳນວນເງິນຝາກ</Label>
                        <Input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>ຍົກເລີກ</Button>
                        <Button type="submit">ບັນທຶກ</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default function CooperativeDepositsPage() {
    const [members, setMembers] = useState<CooperativeMember[]>([]);
    const [deposits, setDeposits] = useState<CooperativeDeposit[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribeMembers = listenToCooperativeMembers(setMembers);
        const unsubscribeDeposits = listenToCooperativeDeposits(setDeposits);
        return () => {
            unsubscribeMembers();
            unsubscribeDeposits();
        };
    }, []);

    const totalDeposits = useMemo(() => {
        return deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    }, [deposits]);

    const handleAddDeposit = async (deposit: Omit<CooperativeDeposit, 'id'|'createdAt'>) => {
        await addCooperativeDeposit(deposit);
    };

    const handleDeleteDeposit = async (id: string) => {
        if (window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການຝາກເງິນນີ້?")) {
            await deleteCooperativeDeposit(id);
            toast({ title: "ລຶບລາຍການສຳເລັດ" });
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
                <h1 className="text-xl font-bold tracking-tight">ບັນຊີເງິນຝາກສະຫະກອນ</h1>
                 <div className="ml-auto">
                    <AddDepositDialog members={members} onAddDeposit={handleAddDeposit} />
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>ຍອດລວມເງິນຝາກ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{formatCurrency(totalDeposits)} KIP</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>ປະຫວັດການຝາກເງິນ</CardTitle>
                        <CardDescription>ລາຍການຝາກເງິນຂອງສະມາຊິກທັງໝົດ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ວັນທີ</TableHead>
                                    <TableHead>ຊື່ສະມາຊິກ</TableHead>
                                    <TableHead className="text-right">ຈຳນວນເງິນ (KIP)</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deposits.length > 0 ? deposits.map(deposit => (
                                    <TableRow key={deposit.id}>
                                        <TableCell>{format(deposit.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="font-medium">{deposit.memberName}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(deposit.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>ການດຳເນີນການ</DropdownMenuLabel>
                                                    <DropdownMenuItem disabled>ແກ້ໄຂ</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteDeposit(deposit.id)} className="text-red-500">ລຶບ</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            ຍັງບໍ່ມີລາຍການຝາກເງິນ.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
