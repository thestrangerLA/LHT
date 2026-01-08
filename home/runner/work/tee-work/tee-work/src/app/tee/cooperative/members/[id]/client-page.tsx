
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Trash2, PlusCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { CooperativeMember, CooperativeDeposit } from '@/lib/types';
import { deleteCooperativeMember, listenToCooperativeDepositsForMember } from '@/services/cooperativeMemberService';
import { addCooperativeDeposit, deleteCooperativeDeposit } from '@/services/cooperativeDepositService';
import { AddDepositDialog } from './_components/AddDepositDialog';
import { EditMemberDialog } from './_components/EditMemberDialog';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
};

export default function MemberDetailPageClient({ initialMember, initialDeposits }: { initialMember: CooperativeMember, initialDeposits: CooperativeDeposit[] }) {
    const { toast } = useToast();
    const [member, setMember] = useState(initialMember);
    const [deposits, setDeposits] = useState(initialDeposits);
    const [isAddDepositOpen, setAddDepositOpen] = useState(false);
    const [isEditMemberOpen, setEditMemberOpen] = useState(false);

     useEffect(() => {
        const unsubscribe = listenToCooperativeDepositsForMember(member.id, setDeposits);
        return () => unsubscribe();
    }, [member.id]);

    const totalDeposit = useMemo(() => {
        return deposits.reduce((sum, d) => sum + d.amount, member.deposit);
    }, [deposits, member.deposit]);

    const handleAddDeposit = async (amount: number, date: Date) => {
        try {
            await addCooperativeDeposit({
                memberId: member.id,
                memberName: member.name,
                date: date,
                amount: amount,
            });
            toast({ title: "ເພີ່ມເງິນຝາກສຳເລັດ" });
        } catch (error) {
            toast({ title: "ເກີດຂໍ້ຜິດພາດ", variant: "destructive" });
        }
    };
    
    const handleDeleteDeposit = async (id: string) => {
        if (!window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການຝາກເງິນນີ້?")) return;
        try {
            await deleteCooperativeDeposit(id);
            toast({ title: "ລຶບລາຍການສຳເລັດ" });
        } catch (error) {
            toast({ title: "ເກີດຂໍ້ຜິດພາດ", variant: "destructive" });
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/tee/cooperative/members">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold tracking-tight">{member.name}</h1>
                </div>
                 <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditMemberOpen(true)}><Edit className="mr-2 h-4 w-4"/> ແກ້ໄຂຂໍ້ມູນ</Button>
                    <Button size="sm" onClick={() => setAddDepositOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> ເພີ່ມເງິນຝາກ</Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                     <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>ລະຫັດສະມາຊິກ</CardDescription>
                            <CardTitle className="text-2xl">{member.memberId}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>ວັນທີສະໝັກ</CardDescription>
                            <CardTitle className="text-2xl">{format(member.joinDate, 'dd MMMM yyyy')}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>ຍອດເງິນຝາກລວມ</CardDescription>
                            <CardTitle className="text-2xl text-green-600">{formatCurrency(totalDeposit)} KIP</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>ປະຫວັດການຝາກເງິນ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ວັນທີ</TableHead>
                                    <TableHead className="text-right">ຈຳນວນເງິນ (KIP)</TableHead>
                                    <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deposits.length > 0 ? deposits.map(deposit => (
                                    <TableRow key={deposit.id}>
                                        <TableCell>{format(deposit.date, 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(deposit.amount)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDeposit(deposit.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">ຍັງບໍ່ມີປະຫວັດການຝາກເງິນ</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
            <AddDepositDialog 
                open={isAddDepositOpen} 
                onOpenChange={setAddDepositOpen}
                onAddDeposit={handleAddDeposit}
                memberName={member.name}
            />
            <EditMemberDialog
                open={isEditMemberOpen}
                onOpenChange={setEditMemberOpen}
                member={member}
            />
        </div>
    );
}

