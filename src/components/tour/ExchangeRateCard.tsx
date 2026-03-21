
"use client"

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Currency, ExchangeRates } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';

const currencySymbols: Record<Currency, string> = {
    USD: '$ (ດอลลár)',
    THB: '฿ (ບາດ)',
    LAK: '₭ (ກີບ)',
    CNY: '¥ (ຢວນ)',
};

const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('en-US', options).format(num);

export interface ExchangeRateCardProps {
    totalIncome?: Record<Currency, number>;
    totalCost?: Record<Currency, number>;
    rates: ExchangeRates;
    onRatesChange: (rates: ExchangeRates) => void;
    profitPercentage?: number;
    onProfitPercentageChange?: (percentage: number) => void;
    onCalculatedTotalsChange?: (totals: {
        income: number;
        cost: number;
        profit: number;
        currency: Currency;
    }) => void;
}

const initialTotals: Record<Currency, number> = { LAK: 0, THB: 0, USD: 0, CNY: 0 };

export function ExchangeRateCard({
    totalIncome = initialTotals,
    totalCost = initialTotals,
    rates,
    onRatesChange,
    profitPercentage,
    onProfitPercentageChange,
    onCalculatedTotalsChange
}: ExchangeRateCardProps) {
    const { toast } = useToast();
    const [targetCurrency, setTargetCurrency] = useState<Currency>('LAK');
    const [isClient, setIsClient] = useState(false);
    const [selectedCostCurrencies, setSelectedCostCurrencies] = useState<Currency[]>(['LAK', 'THB', 'USD', 'CNY']);
    const [isSaving, setIsSaving] = useState(false);

    const debouncedOnRatesChange = useDebouncedCallback((newRates: ExchangeRates) => {
        onRatesChange(newRates);
        setIsSaving(true);
        setTimeout(() => {
             toast({ title: "ບັນທຶກອັດຕາແລກປ່ຽນສຳເລັດ" });
             setIsSaving(false);
        }, 1500);
    }, 1500);

    useEffect(() => { 
        setIsClient(true); 
    }, []);

    const handleRateChange = (from: Currency, to: Currency, value: string) => {
        const numericValue = parseFloat(value) || 0;
        const newRates = {
            ...rates,
            [from]: { ...rates[from], [to]: numericValue },
        };
        debouncedOnRatesChange(newRates);
    };

    const handleCostCurrencyToggle = (currency: Currency, checked: boolean) => {
        setSelectedCostCurrencies(prev => 
            checked
                ? [...prev, currency]
                : prev.filter(c => c !== currency)
        );
    };

    const convertCurrency = (amounts: Record<Currency, number> | undefined, selectedCurrencies?: Currency[]) => {
        if (!amounts || typeof amounts !== 'object') {
            return 0;
        }

        const currenciesToConvert = selectedCurrencies || Object.keys(amounts) as Currency[];

        return currenciesToConvert.reduce((acc, currency) => {
            const amount = amounts[currency as keyof typeof amounts] || 0;
            if (currency === targetCurrency) {
                return acc + amount;
            }
            const rate = rates[currency]?.[targetCurrency];
            if (rate) {
                return acc + (amount * rate);
            }
            // Fallback via USD
            const rateToUsd = rates[currency]?.USD;
            const rateFromUsd = rates['USD']?.[targetCurrency];
            if (rateToUsd && rateFromUsd) {
                return acc + (amount * rateToUsd * rateFromUsd);
            }
            return acc;
        }, 0);
    }
    
    const convertedIncome = useMemo(() => convertCurrency(totalIncome), [totalIncome, rates, targetCurrency]);
    const convertedCost = useMemo(() => convertCurrency(totalCost, selectedCostCurrencies), [totalCost, rates, targetCurrency, selectedCostCurrencies]);
    
    const { profit, sellingPrice } = useMemo(() => {
        if (profitPercentage !== undefined && onProfitPercentageChange) {
            const profitAmount = convertedCost * (profitPercentage / 100);
            return { profit: profitAmount, sellingPrice: convertedCost + profitAmount };
        } else {
            const profitAmount = convertedIncome - convertedCost;
            return { profit: profitAmount, sellingPrice: convertedIncome };
        }
    }, [convertedIncome, convertedCost, profitPercentage, onProfitPercentageChange]);
    
    useEffect(() => {
        if (onCalculatedTotalsChange) {
            onCalculatedTotalsChange({
                income: convertedIncome,
                cost: convertedCost,
                profit: profit,
                currency: targetCurrency,
            });
        }
    }, [convertedIncome, convertedCost, profit, targetCurrency, onCalculatedTotalsChange]);

    if (!isClient) {
        return null;
    }

    const showProfitPercentageInput = profitPercentage !== undefined && onProfitPercentageChange;

    return (
        <>
            <div className="print:hidden">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>ອັດຕາແລກປ່ຽນ</CardTitle>
                            <CardDescription>ລະບົບຈະບັນທຶກອັດຕະໂນມັດເມື່ອມີການປ່ຽນແປງ</CardDescription>
                        </div>
                         {isSaving && <span className="text-sm text-blue-500 animate-pulse">ກຳລັງບັນທຶກ...</span>}
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div>
                            <div className="space-y-3 mt-2">
                                {/* Rate inputs... same as before */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 border rounded-md">
                                    <Label className="md:col-span-3 font-semibold">1 USD =</Label>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.USD?.THB || ''} onChange={e => handleRateChange('USD', 'THB', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">THB</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.USD?.LAK || ''} onChange={e => handleRateChange('USD', 'LAK', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">LAK</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.USD?.CNY || ''} onChange={e => handleRateChange('USD', 'CNY', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">CNY</Label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 border rounded-md">
                                    <Label className="md:col-span-3 font-semibold">1 THB =</Label>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.THB?.USD || ''} onChange={e => handleRateChange('THB', 'USD', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">USD</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.THB?.LAK || ''} onChange={e => handleRateChange('THB', 'LAK', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">LAK</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.THB?.CNY || ''} onChange={e => handleRateChange('THB', 'CNY', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">CNY</Label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 border rounded-md">
                                    <Label className="md:col-span-3 font-semibold">1 CNY =</Label>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.CNY?.USD || ''} onChange={e => handleRateChange('CNY', 'USD', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">USD</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.CNY?.THB || ''} onChange={e => handleRateChange('CNY', 'THB', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">THB</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.CNY?.LAK || ''} onChange={e => handleRateChange('CNY', 'LAK', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">LAK</Label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 border rounded-md">
                                    <Label className="md:col-span-3 font-semibold">1 LAK =</Label>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.LAK?.USD || ''} onChange={e => handleRateChange('LAK', 'USD', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">USD</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.LAK?.THB || ''} onChange={e => handleRateChange('LAK', 'THB', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">THB</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={rates.LAK?.CNY || ''} onChange={e => handleRateChange('LAK', 'CNY', e.target.value)} className="h-8"/>
                                        <Label className="text-xs">CNY</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>ປ່ຽນເປັນສະກຸນເງິນທີ່ຕ້ອງການ</CardTitle>
                    <div className="grid md:grid-cols-2 gap-4 items-end pt-4">
                        <div>
                            <Label htmlFor="target-currency">ເລືອກສະກຸນເງິນ</Label>
                            <Select value={targetCurrency} onValueChange={(v: Currency) => setTargetCurrency(v)}>
                                <SelectTrigger id="target-currency">
                                    <SelectValue placeholder="ເລືອກສະກຸນເງິນ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(currencySymbols) as Currency[]).map(c => (
                                        <SelectItem key={c} value={c}>{currencySymbols[c]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>ເລືອກຕົ້ນທຶນທີ່ຈະປ່ຽນ</Label>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2 border rounded-md bg-muted/50">
                                {(Object.keys(totalCost || {}) as Currency[]).map(currency => (
                                    (totalCost[currency as keyof typeof totalCost] > 0) && (
                                        <div key={currency} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`cost-currency-${currency}`}
                                                checked={selectedCostCurrencies.includes(currency as Currency)}
                                                onCheckedChange={(checked) => handleCostCurrencyToggle(currency as Currency, !!checked)}
                                            />
                                            <Label htmlFor={`cost-currency-${currency}`} className="font-normal">{currency}</Label>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                    {showProfitPercentageInput && (
                         <div className="grid md:grid-cols-2 gap-4 items-end pt-4">
                             <div>
                                <Label htmlFor="profit-percentage">ກຳໄລ (%)</Label>
                                <Input
                                    id="profit-percentage"
                                    type="number"
                                    value={profitPercentage || ''}
                                    onChange={(e) => onProfitPercentageChange(Number(e.target.value))}
                                    placeholder="20"
                                />
                             </div>
                         </div>
                    )}
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-gray-100 border-gray-200">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-medium">ຕົ້ນທຶນລວມ ({targetCurrency})</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-2xl font-bold">{formatNumber(convertedCost)} <span className="text-sm font-medium">{targetCurrency}</span></p>
                        </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-200">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-medium">ກຳໄລ ({showProfitPercentageInput ? `${profitPercentage}%` : 'ຈາກລາຍຮັບ'})</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className={`text-2xl font-bold ${profit >= 0 ? 'text-orange-600' : 'text-red-600'}`}>{formatNumber(profit)} <span className="text-sm font-medium">{targetCurrency}</span></p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-medium">ລາຄາຂາຍ ({targetCurrency})</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className={`text-2xl font-bold text-green-600`}>{formatNumber(sellingPrice)} <span className="text-sm font-medium">{targetCurrency}</span></p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </>
    );
}
