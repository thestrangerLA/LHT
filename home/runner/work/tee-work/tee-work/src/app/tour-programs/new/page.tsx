

"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addTourProgram } from '@/services/tourProgramService';
import type { TourProgram, Currency } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay } from 'date-fns';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StaticExportWrapper from '@/components/StaticExportWrapper';
import { useClientRouter } from '@/hooks/useClientRouter';


const currencies: Currency[] = ['LAK', 'THB', 'USD', 'CNY'];

const CurrencyInput = ({ label, amount, currency, onAmountChange, onCurrencyChange }: {
    label: string;
    amount: number;
    currency: Currency;
    onAmountChange: (value: number) => void;
    onCurrencyChange: (value: Currency) => void;
}) => (
    <div className="grid gap-2">
        <Label htmlFor={label.toLowerCase()}>{label}</Label>
        <div className="flex gap-2">
            <Input
                id={label.toLowerCase()}
                type="number"
                value={amount || ''}
                onChange={(e) => onAmountChange(Number(e.target.value))}
                className="w-2/3"
            />
            <Select value={currency} onValueChange={(v) => onCurrencyChange(v as Currency)}>
                <SelectTrigger className="w-1/3">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    </div>
);


function NewTourProgramPageComponent() {
    const { toast } = useToast();
    const router = useClientRouter();
    const [date, setDate] = useState<Date | undefined>();
    const [formData, setFormData] = useState<Omit<TourProgram, 'id' | 'createdAt' | 'date'>>({
        tourCode: '',
        programName: '',
        groupName: '',
        pax: 0,
        destination: '',
        tourDates: '',
        durationDays: 0,
        price: 0,
        priceCurrency: 'LAK',
        bankCharge: 0,
        bankChargeCurrency: 'LAK',
        totalPrice: 0,
    });
    
    useEffect(() => {
        setDate(new Date());
    }, []);

    const handleFormValueChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({...prev, [field]: value}));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !formData.programName) {
            toast({
                title: "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ",
                description: "ກະລຸນາເລືอกວັນທີ ແລະ ໃສ່ຊື່ໂປຣແກຣມ",
                variant: "destructive"
            });
            return;
        }

        try {
             const newProgramData: Omit<TourProgram, 'id' | 'createdAt'> = {
                ...formData,
                date: startOfDay(date),
                totalPrice: formData.priceCurrency === formData.bankChargeCurrency ? formData.price + formData.bankCharge : formData.price,
            };
            const newProgramId = await addTourProgram(newProgramData);
            toast({
                title: "ສ້າງໂປຣແກຣມທົວສຳເລັດ",
                description: `ໂປຣແກຣມ "${formData.programName}" ຖືກສ້າງແລ້ວ`,
            });
            router.push(`/tour-programs/${newProgramId}`);
        } catch (error) {
            console.error("Error adding tour program:", error);
            toast({
                title: "ເກີດຂໍ້ຜິດພາດ",
                description: "ບໍ່ສາມາດສ້າງໂປຣແກຣມທົວໄດ້",
                variant: "destructive"
            });
        }
    };


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/tour-programs">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">ກັບໄປໜ้ารາຍການໂປຣແກຣມ</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight font-headline">ເພີ່ມໂປຣແກຣມທົວໃໝ່</h1>
                </div>
            </header>
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
                <Card className="w-full max-w-4xl">
                    <CardHeader>
                        <CardTitle>ລາຍລະອຽດໂປຣແກຣມທົວ</CardTitle>
                        <CardDescription>ກອກຂໍ້ມູນເພື່ອສ້າງໂປຣແກຣມທົວໃໝ່</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="date">ວັນທີສ້າງ</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "PPP") : <span>ເລືອກວັນທີ</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus  />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tourCode">Group Code</Label>
                                    <Input id="tourCode" name="tourCode" value={formData.tourCode} onChange={(e) => handleFormValueChange('tourCode', e.target.value)} />
                                </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="programName">Tour Program</Label>
                                    <Input id="programName" name="programName" value={formData.programName} onChange={(e) => handleFormValueChange('programName', e.target.value)} required />
                                </div>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="tourDates">ວັນທີເດີນທາງ (Tour Dates)</Label>
                                <Textarea id="tourDates" name="tourDates" value={formData.tourDates} onChange={(e) => handleFormValueChange('tourDates', e.target.value)} placeholder="ຕົວຢ່າງ 30/08/2025-31/08/2025&#10;06/09/2025-07/09/2025" />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="groupName">Nationality</Label>
                                    <Input id="groupName" name="groupName" value={formData.groupName} onChange={(e) => handleFormValueChange('groupName', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pax">ຈຳນວນຄົນ (Pax)</Label>
                                    <Input id="pax" name="pax" type="number" value={formData.pax || ''} onChange={(e) => handleFormValueChange('pax', Number(e.target.value))} />
                                </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="destination">ຈຸດໝາຍ</Label>
                                    <Input id="destination" name="destination" value={formData.destination} onChange={(e) => handleFormValueChange('destination', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="durationDays">ໄລຍະເວລາ (ວັນ)</Label>
                                    <Input id="durationDays" name="durationDays" type="number" value={formData.durationDays || ''} onChange={(e) => handleFormValueChange('durationDays', Number(e.target.value))} />
                                </div>
                            </div>

                             <div className="grid md:grid-cols-2 gap-6">
                                 <CurrencyInput 
                                    label="Price"
                                    amount={formData.price}
                                    currency={formData.priceCurrency}
                                    onAmountChange={(v) => handleFormValueChange('price', v)}
                                    onCurrencyChange={(v) => handleFormValueChange('priceCurrency', v)}
                                 />
                                 <CurrencyInput 
                                    label="Bank Charge"
                                    amount={formData.bankCharge}
                                    currency={formData.bankChargeCurrency}
                                    onAmountChange={(v) => handleFormValueChange('bankCharge', v)}
                                    onCurrencyChange={(v) => handleFormValueChange('bankChargeCurrency', v)}
                                 />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" asChild><Link href="/tour-programs">ຍົກເລີກ</Link></Button>
                                <Button type="submit">ບັນທຶກ ແລະ ໄປຕໍ່</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default function NewTourProgramPage() {
    return (
        <StaticExportWrapper>
            <NewTourProgramPageComponent />
        </StaticExportWrapper>
    )
}
