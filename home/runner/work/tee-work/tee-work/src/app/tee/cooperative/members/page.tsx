
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay } from "date-fns";
import { ArrowLeft, Users, Calendar as CalendarIcon, PlusCircle, ChevronRight, MoreHorizontal, Trash2 } from "lucide-react";
import type { CooperativeMember, CooperativeDeposit } from '@/lib/types';
import { listenToCooperativeMembers, addCooperativeMember, deleteCooperativeMember } from '@/services/cooperativeMemberService';
import { listenToCooperativeDeposits, addCooperativeDeposit } from '@/services/cooperativeDepositService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


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
    
    const membersWithTotalDeposits = useMemo(() => {
        return members.map(member => {
            const memberDeposits = deposits.filter(d => d.memberId === member.id);
            const totalDeposit = memberDeposits.reduce((sum, d) => sum + d.amount, member.deposit);
            return { ...member, totalDeposit };
        }).sort((a,b) => (a.memberId > b.memberId) ? 1 : -1);
    }, [members, deposits]);


    const handleAddMember = async (member: Omit<CooperativeMember, 'id' | 'createdAt'>) => {
        await addCooperativeMember(member);
    };

    const handleDeleteMember = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສະມາຊິກຄົນນີ້?")) {
            await deleteCooperativeMember(id);
            toast({ title: "ລຶບສະມາຊິກສຳເລັດ" });
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
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0">
                <Card>
                    <CardHeader>
                        <CardTitle>ລາຍຊື່ສະມາຊິກ</CardTitle>
                        <CardDescription>ກົດທີ່ລາຍການເພື່ອເບິ່ງປະຫວັດການຝາກເງິນ</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ລະຫັດ</TableHead>
                                    <TableHead>ຊື່-ນາມສະກຸນ</TableHead>
                                    <TableHead>ວັນທີສະໝັກ</TableHead>
                                    <TableHead className="text-right">ຍອດເງິນຝາກລວມ</TableHead>
                                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {membersWithTotalDeposits.map(member => (
                                    <TableRow key={member.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell onClick={() => window.location.href=`/tee/cooperative/members/${member.id}`} className="font-mono">{member.memberId}</TableCell>
                                        <TableCell onClick={() => window.location.href=`/tee/cooperative/members/${member.id}`} className="font-medium">{member.name}</TableCell>
                                        <TableCell onClick={() => window.location.href=`/tee/cooperative/members/${member.id}`}>{format(member.joinDate, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell onClick={() => window.location.href=`/tee/cooperative/members/${member.id}`} className="text-right font-mono">{formatCurrency(member.totalDeposit)} KIP</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>ການດຳເນີນການ</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); window.location.href=`/tee/cooperative/members/${member.id}`}}>ເບິ່ງລາຍລະອຽດ</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-500" onSelect={(e) => handleDeleteMember(e, member.id)}>ລຶບ</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {membersWithTotalDeposits.length === 0 && (
                            <div className="text-center text-muted-foreground py-16">
                                ຍັງບໍ່ມີສະມາຊິກ. ກົດ "ເພີ່ມສະມາຊິກ" ເພື່ອເລີ່ມຕົ້ນ.
                            </div>
                         )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
