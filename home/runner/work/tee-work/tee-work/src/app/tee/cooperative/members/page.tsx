
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
import { ArrowLeft, Users, Calendar as CalendarIcon, Trash2, PlusCircle, MoreHorizontal, Check, ChevronsUpDown } from "lucide-react";
import type { CooperativeMember, CooperativeDeposit } from '@/lib/types';
import { listenToCooperativeMembers, addCooperativeMember, updateCooperativeMember, deleteCooperativeMember } from '@/services/cooperativeMemberService';
import { listenToCooperativeDeposits, addCooperativeDeposit, deleteCooperativeDeposit } from '@/services/cooperativeDepositService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

const AddMemberDialog = ({ onAddMember }: { onAddMember: (member: Omit<CooperativeMember, 'id'|'createdAt'>) => Promise<void> }) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [memberId, setMemberId] = useState('');
    const [name, setName] = useState('');
    const [joinDate, setJoinDate] = useState<Date | undefined>(new Date());
    const [deposit, setDeposit] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId || !name || !joinDate) {
            toast({ title: "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ", variant: "destructive" });
            return;
        }

        try {
            await onAddMember({
                memberId,
                name,
                joinDate: startOfDay(joinDate),
                deposit
            });
            toast({ title: "ເພີ່ມສະມາຊິກສຳເລັດ" });
            setOpen(false);
            setMemberId('');
            setName('');
            setJoinDate(new Date());
            setDeposit(0);
        } catch (error) {
            console.error("Error adding member:", error);
            toast({ title: "ເກີດຂໍ້ຜິດພາດ", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມສະມາຊິກ</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ເພີ່ມສະມາຊິກໃໝ່</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="memberId">ລະຫັດສະມາຊິກ</Label>
                        <Input id="memberId" value={memberId} onChange={e => setMemberId(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">ຊື່-ນາມສະກຸນ</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="joinDate">ວັນທີສະໝັກ</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {joinDate ? format(joinDate, "PPP") : <span>ເລືອກວັນທີ</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={joinDate} onSelect={setJoinDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="deposit">ເງິນຝາກເລີ່ມຕົ້ນ</Label>
                        <Input id="deposit" type="number" value={deposit || ''} onChange={e => setDeposit(Number(e.target.value))} />
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

const AddDepositDialog = ({ members, onAddDeposit }: { members: CooperativeMember[], onAddDeposit: (deposit: Omit<CooperativeDeposit, 'id'|'createdAt'>) => Promise<void> }) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [depositDate, setDepositDate] = useState<Date | undefined>(new Date());
    const [amount, setAmount] = useState(0);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);

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
                        <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
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
                                                    setIsComboboxOpen(false);
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

export default function CooperativeMembersPage() {
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

    const handleAddMember = async (member: Omit<CooperativeMember, 'id' | 'createdAt'>) => {
        await addCooperativeMember(member);
    };

    const handleDeleteMember = async (id: string) => {
        if (window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສະມາຊິກຄົນນີ້?")) {
            await deleteCooperativeMember(id);
            toast({ title: "ລຶບສະມາຊິກສຳເລັດ" });
        }
    };

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
                <h1 className="text-xl font-bold tracking-tight">ສະມາຊິກ ແລະ ເງິນຝາກ</h1>
                 <div className="ml-auto flex items-center gap-2">
                    <AddMemberDialog onAddMember={handleAddMember} />
                    <AddDepositDialog members={members} onAddDeposit={handleAddDeposit} />
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0">
                <Tabs defaultValue="members">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="members">ສະມາຊິກທັງໝົດ</TabsTrigger>
                        <TabsTrigger value="deposits">ປະຫວັດເງິນຝາກ</TabsTrigger>
                    </TabsList>
                    <TabsContent value="members">
                        <Card>
                            <CardHeader>
                                <CardTitle>ລາຍຊື່ສະມາຊິກ</CardTitle>
                                <CardDescription>ລາຍຊື່ສະມາຊິກທັງໝົດໃນລະບົບສະຫະກອນ</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ລະຫັດສະມາຊິກ</TableHead>
                                            <TableHead>ຊື່-ນາມສະກຸນ</TableHead>
                                            <TableHead>ວັນທີສະໝັກ</TableHead>
                                            <TableHead className="text-right">ເງິນຝາກ (KIP)</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members.length > 0 ? members.map(member => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-mono">{member.memberId}</TableCell>
                                                <TableCell className="font-medium">{member.name}</TableCell>
                                                <TableCell>{format(member.joinDate, 'dd/MM/yyyy')}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(member.deposit)}</TableCell>
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
                                                            <DropdownMenuItem onClick={() => handleDeleteMember(member.id)} className="text-red-500">ລຶບ</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    ຍັງບໍ່ມີສະມາຊິກ.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="deposits">
                        <Card>
                            <CardHeader>
                                <CardTitle>ປະຫວັດການຝາກເງິນ</CardTitle>
                                <CardDescription>ລາຍການຝາກເງິນຂອງສະມາຊິກທັງໝົດ. ຍອດລວມ: {formatCurrency(totalDeposits)} KIP</CardDescription>
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
                                                     <Button variant="ghost" size="icon" onClick={() => handleDeleteDeposit(deposit.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
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
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
