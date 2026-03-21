"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< HEAD
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Trash2, PlusCircle, Calendar as CalendarIcon, Printer, Eye, EyeOff, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
    listenToTourCostItemsForProgram, 
    addTourCostItem, 
    updateTourCostItem, 
    deleteTourCostItem, 
    listenToTourIncomeItemsForProgram,
    addTourIncomeItem,
    updateTourIncomeItem,
    deleteTourIncomeItem,
    updateTourProgram,
} from '@/services/tourProgramService';
import type { TourCostItem, TourIncomeItem, TourProgram, Currency, DividendItem } from '@/lib/types';
=======
>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Save, Trash2, MapPin, Calendar as CalendarIcon, BedDouble, Truck, Plane, TrainFront, PlusCircle, Camera, UtensilsCrossed, Users, FileText, Clock, Eye, EyeOff, Printer, Earth, Ticket } from "lucide-react";
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { TotalCostCard } from '@/components/tour/TotalCostCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ExchangeRateCard, ExchangeRates } from '@/components/tour/ExchangeRateCard';
import { toDateSafe } from '@/lib/timestamp';
import { useDebouncedCallback } from 'use-debounce';
import { updateTourProgram, deleteTourProgram } from '@/services/tourProgramService';

// Types
type Currency = 'USD' | 'THB' | 'LAK' | 'CNY';

const currencySymbols: Record<Currency, string> = {
    USD: '$ (ດอลลár)',
    THB: '฿ (ບາດ)',
    LAK: '₭ (ກີບ)',
    CNY: '¥ (ຢວນ)',
};

const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('en-US', options).format(num);

type DateValue = Date | string | undefined | null;

<<<<<<< HEAD
const initialDividendStructure: DividendItem[] = [
    { id: '1', name: 'ບໍລິສັດ', percentage: 0.30 },
    { id: '2', name: 'xiuge', percentage: 0.10 },
    { id: '3', name: 'wenyan', percentage: 0.10 },
    { id: '4', name: 'ການຕະຫຼາດ', percentage: 0.15 },
    { id: '5', name: 'CEO', percentage: 0.30 },
    { id: '6', name: 'ບັນຊີ', percentage: 0.05 },
];
=======
// --- Component Prop Types ---
type Accommodation = { id: string; name: string; type: 'hotel' | 'guesthouse'; checkInDate?: DateValue; rooms: Room[]; };
type Room = { id: string; type: string; numRooms: number; numNights: number; price: number; currency: Currency; };
type Trip = { id: string; location: string; route: string; vehicleType: string; numVehicles: number; numDays: number; pricePerVehicle: number; currency: Currency; };
type Flight = { id: string; from: string; to: string; departureDate?: DateValue; departureTime: string; pricePerPerson: number; numPeople: number; currency: Currency; };
type TrainTicket = { id: string; from: string; to: string; departureDate?: DateValue; departureTime: string; ticketClass: string; numTickets: number; pricePerTicket: number; currency: Currency; };
type EntranceFee = { id: string; locationName: string; pax: number; numLocations: number; price: number; currency: Currency; };
type MealCost = { id: string; name: string; pax: number; breakfast: number; lunch: number; dinner: number; pricePerMeal: number; currency: Currency; };
type GuideFee = { id: string; guideName: string; numGuides: number; numDays: number; pricePerDay: number; currency: Currency; };
type DocumentFee = { id: string; documentName: string; pax: number; price: number; currency: Currency; };
type OverseasPackage = { id: string; name: string; priceUSD: number; priceTHB: number; priceCNY: number; };
type ActivityCost = { id: string; name: string; pax: number; price: number; currency: Currency; };

interface TourInfo {
    tourCode: string;
    programName: string;
    groupName: string;
    destination: string;
    tourDates: string;
    date: DateValue;
    durationDays: number;
    pax: number;
}

interface TourCosts {
    accommodations: Accommodation[];
    trips: Trip[];
    flights: Flight[];
    trainTickets: TrainTicket[];
    entranceFees: EntranceFee[];
    meals: MealCost[];
    guides: GuideFee[];
    documents: DocumentFee[];
    overseasPackages: OverseasPackage[];
    activities: ActivityCost[];
}

export interface SavedProgram {
    id: string;
    savedAt?: DateValue;
    tourInfo: TourInfo;
    allCosts: TourCosts;
    exchangeRates?: ExchangeRates;
    profitPercentage?: number;
}
>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2

const initialRates: ExchangeRates = {
    USD: { THB: 38, LAK: 25000, CNY: 8 },
    THB: { USD: 0.032, LAK: 700, CNY: 0.25 },
    CNY: { USD: 0.20, THB: 6, LAK: 3500 },
    LAK: { USD: 0.00005, THB: 0.0015, CNY: 0.00035 },
};

const CostCategoryContent = ({ title, icon, children, summary }: { title: string, icon: React.ReactNode, children: React.ReactNode, summary: React.ReactNode }) => (
     <AccordionItem value={title.toLowerCase().replace(/\s/g, '-')} className="bg-card p-4 rounded-lg">
        <AccordionTrigger className="text-lg font-semibold p-0 hover:no-underline">
          <div className="flex items-center gap-3">
            {icon} {title}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
            {children}
            {summary}
        </AccordionContent>
    </AccordionItem>
);

<<<<<<< HEAD
type TabValue = 'info' | 'income' | 'costs' | 'summary' | 'dividend';
=======
>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2

export default function TourProgramClientPage({ initialProgram }: { initialProgram: SavedProgram | null}) {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const programId = params.id as string;
    
    const [tourInfo, setTourInfo] = useState<TourInfo>(initialProgram?.tourInfo || {
        tourCode: `LTH${format(new Date(),'yyyyMMddHHmmss')}`,
        programName: '',
        groupName: '',
        destination: '',
        tourDates: '',
        date: new Date(),
        durationDays: 1,
        pax: 1,
    });
    const [dividendCurrency, setDividendCurrency] = useState<Currency>('LAK');

    const [allCosts, setAllCosts] = useState<TourCosts>(initialProgram?.allCosts || {
        accommodations: [], trips: [], flights: [], trainTickets: [],
        entranceFees: [], meals: [], guides: [], documents: [], overseasPackages: [], activities: []
    });

    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(initialProgram?.exchangeRates || initialRates);
    const [profitPercentage, setProfitPercentage] = useState<number>(initialProgram?.profitPercentage || 20);
    
    const [itemVisibility, setItemVisibility] = useState<Record<string, boolean>>({});

    const handleSaveProgram = async () => {
        if (!programId) return;
        try {
            await updateTourProgram(programId, {
                tourInfo,
                allCosts,
                exchangeRates,
                profitPercentage,
            });
            toast({
                title: "ບັນທຶກໂປຣແກຣມສຳເລັດ",
                description: `ຂໍ້ມູນ ${tourInfo.programName || 'ບໍ່ມີຊື່'} ໄດ້ຖືກບັນທຶກແລ້ວ.`,
            });
        } catch (e) {
            toast({
                title: "Error Saving",
                description: "Could not save the program.",
                variant: "destructive"
            });
        }
    };
    
    const handleDeleteProgram = async () => {
        if (window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໂປຣແກຣມທົວນີ້?")) {
            await deleteTourProgram(programId);
            router.push('/tour-programs');
        }
    };

<<<<<<< HEAD
    useEffect(() => {
        if (initialProgram) {
            setLocalProgram(initialProgram);
            setExchangeRates(initialProgram.exchangeRates || initialRates);
            setLoading(false);
        } else if (localProgram?.id) {
             setLoading(true);
             const fetchProgram = async () => {
                 try {
                    const fetchedProgram = await new Promise<TourProgram | null>((resolve) => setTimeout(() => resolve(initialProgram), 1000));
                    if (fetchedProgram) {
                        setLocalProgram(fetchedProgram);
                        setExchangeRates(fetchedProgram.exchangeRates || initialRates);
                    } else {
                        setError('Program not found');
                    }
                 } catch(err) {
                     setError('Failed to load program data');
                 } finally {
                     setLoading(false);
                 }
             }
             fetchProgram();
        } else {
            setLoading(false);
        }

    }, [initialProgram]);


    useEffect(() => {
        if (!localProgram?.id) return;

        const unsubscribeCosts = listenToTourCostItemsForProgram(localProgram.id, setCostItems);
        const unsubscribeIncomes = listenToTourIncomeItemsForProgram(localProgram.id, setIncomeItems);
        
        if (localProgram.priceCurrency) {
            setPrintCurrencies([localProgram.priceCurrency]);
        }

        return () => {
            unsubscribeCosts();
            unsubscribeIncomes();
        };
    }, [localProgram?.id, localProgram?.priceCurrency]);

    const handleProgramChange = useCallback((field: keyof TourProgram, value: any) => {
        setLocalProgram(prev => prev ? ({ ...prev, [field]: value }) : null);
=======
    const updateCosts = useCallback((category: keyof TourCosts, data: any[]) => {
        setAllCosts(prev => ({ ...prev, [category]: data }));
>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2
    }, []);

    // Generic CRUD operations
    const addItem = <T extends keyof TourCosts>(category: T, newItem: any) => {
        const currentItems = allCosts[category] as any[] || [];
        updateCosts(category, [...currentItems, newItem]);
    };

    const updateItem = <T extends keyof TourCosts>(category: T, itemId: string, field: string, value: any) => {
        const currentItems = allCosts[category] as any[];
        const updatedItems = currentItems.map(item => item.id === itemId ? { ...item, [field]: value } : item);
        updateCosts(category, updatedItems as TourCosts[T]);
    };
    
    const deleteItem = <T extends keyof TourCosts>(category: T, itemId: string) => {
        const updatedItems = (allCosts[category] || []).filter((item: any) => item.id !== itemId);
        updateCosts(category, updatedItems as TourCosts[T]);
    };

    const addAccommodation = () => addItem('accommodations', { id: uuidv4(), name: '', type: 'hotel', rooms: [{ id: uuidv4(), type: 'เตียงเดี่ยว', numRooms: 1, numNights: 1, price: 0, currency: 'USD' }] });
    const addRoom = (accId: string) => {
        const accommodations = allCosts.accommodations.map(acc => {
            if (acc.id === accId) {
                const newRoom = { id: uuidv4(), type: 'เตียงเดี่ยว', numRooms: 1, numNights: 1, price: 0, currency: 'USD' };
                return { ...acc, rooms: [...acc.rooms, newRoom] };
            }
<<<<<<< HEAD

            const { id, createdAt, date, ...dataToUpdate } = updatedProgram;
            await updateTourProgram(id, dataToUpdate);
            
            setLocalProgram(updatedProgram);

            toast({ title: "ບັນທຶກຂໍ້ມູນໂປຣແກຣມແລ້ວ" });
        } catch (error) {
             console.error("Failed to save program info:", error);
            toast({ title: "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [localProgram, isSaving, toast, exchangeRates]);
    
    const handleAddCostItem = async () => {
        if (!localProgram?.id) return;
        try {
            await addTourCostItem(localProgram.id);
        } catch (error) { toast({ title: "ເກີດຂໍ້ຜິດພາດໃນການເພີ່ມຕົ້ນທຶນ", variant: "destructive" }); }
    };
    
    const handleUpdateCostItem = useCallback((itemId: string, field: keyof TourCostItem, value: any) => {
        setCostItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    }, []);

    const handleSaveCostItems = async () => {
        setIsTableSaving(true);
        const promises = costItems.map(item => {
            const { id, ...dataToUpdate } = item;
            return updateTourCostItem(id, dataToUpdate);
        });
        try {
            await Promise.all(promises);
            toast({title: "ບັນທຶກລາຍຈ່າຍສຳເລັດ"});
        } catch (error) {
            console.error("Error saving cost items", error);
            toast({title: "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກລາຍຈ່າຍ", variant: "destructive"})
        } finally {
            setIsTableSaving(false);
        }
    };

    const handleDeleteCostItem = async (itemId: string) => {
        if (!window.confirm("ยืนยันการลบรายการต้นทุนนี้?")) return;
        try { await deleteTourCostItem(itemId); toast({title: "ลบรายการต้นทุนสำเร็จ"}); } 
        catch (error) { toast({ title: "ເກີດຂໍ້ຜິດພາດໃນການລົບຕົ້ນທຶນ", variant: "destructive" }); }
    };

    const handleAddIncomeItem = async () => {
        if (!localProgram?.id) return;
        try {
            await addTourIncomeItem(localProgram.id);
        } catch (error) { toast({ title: "ເກີດຂໍ້ຜິດພາດໃນการเพิ่มรายรับ", variant: "destructive" }); }
    };

    const handleUpdateIncomeItem = useCallback((itemId: string, field: keyof TourIncomeItem, value: any) => {
        setIncomeItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    }, []);
    
    const handleSaveIncomeItems = async () => {
        setIsTableSaving(true);
        const promises = incomeItems.map(item => {
            const { id, ...dataToUpdate } = item;
            return updateTourIncomeItem(id, dataToUpdate);
        });
        try {
            await Promise.all(promises);
            toast({title: "ບັນທຶກລາຍຮັບສຳເລັດ"});
        } catch (error) {
            console.error("Error saving income items", error);
            toast({title: "ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກລາຍຮັບ", variant: "destructive"})
        } finally {
            setIsTableSaving(false);
        }
    };

    const handleDeleteIncomeItem = async (itemId: string) => {
        if (!window.confirm("ยืนยันการลบรายการรายรับนี้?")) return;
        try { await deleteTourIncomeItem(itemId); toast({title: "ลบรายการรายรับสำเร็จ"}); } 
        catch (error) { toast({ title: "เกิดข้อผิดพลาดในการลบรายรับ", variant: "destructive" }); }
    };

    const handlePrint = () => {
        window.print();
    }
    
    const programIncome = useMemo(() => {
        if (!localProgram) return { LAK: 0, THB: 0, USD: 0, CNY: 0 };
        const incomeTotals: Record<Currency, number> = { LAK: 0, THB: 0, USD: 0, CNY: 0 };
        if ((localProgram.price || 0) > 0 && localProgram.priceCurrency) {
            incomeTotals[localProgram.priceCurrency] += localProgram.price;
        }
        if ((localProgram.bankCharge || 0) > 0 && localProgram.bankChargeCurrency) {
            incomeTotals[localProgram.bankChargeCurrency] += localProgram.bankCharge;
        }
        return incomeTotals;
    }, [localProgram]);

    const summaryData = useMemo(() => {
        const totalCosts: Record<Currency, number> = { LAK: 0, THB: 0, USD: 0, CNY: 0 };
        costItems.forEach(item => {
            totalCosts.LAK += item.lak || 0;
            totalCosts.THB += item.thb || 0;
            totalCosts.USD += item.usd || 0;
            totalCosts.CNY += item.cny || 0;
        });

        const totalIncomes = allCurrencies.reduce((acc, c) => {
            acc[c] = (programIncome[c] || 0) + incomeItems.reduce((sum, item) => sum + (item[c.toLowerCase() as keyof typeof item] as number || 0), 0);
            return acc;
        }, { LAK: 0, THB: 0, USD: 0, CNY: 0 });
        
        const profit = allCurrencies.reduce((acc, c) => {
            acc[c] = (totalIncomes[c] || 0) - (totalCosts[c] || 0);
            return acc;
        }, { LAK: 0, THB: 0, USD: 0, CNY: 0 } as Record<Currency, number>);
        
        return { totalCosts, totalIncomes, profit };
    }, [costItems, incomeItems, programIncome]);

    const totalProfitInSelectedCurrency = useMemo(() => {
        const rates = localProgram?.exchangeRates || initialRates;
        const profit = summaryData.profit;
        if (!profit) return 0;
    
        return (Object.keys(profit) as Currency[]).reduce((total, currency) => {
            const amount = profit[currency] || 0;
            if (currency === dividendCurrency) {
                return total + amount;
            }
            const rate = rates[currency]?.[dividendCurrency];
            if (rate) {
                return total + amount * rate;
            }
            // Fallback via USD if direct rate is not available
            const rateToUsd = rates[currency]?.USD;
            const rateFromUsd = rates['USD']?.[dividendCurrency];
            if (rateToUsd && rateFromUsd) {
                return total + (amount * rateToUsd * rateFromUsd);
            }
            return total;
        }, 0);
    }, [summaryData.profit, localProgram?.exchangeRates, dividendCurrency]);
    
    
    const handlePrintCurrencyToggle = (currency: Currency) => {
        setPrintCurrencies(prev => 
            prev.includes(currency) 
                ? prev.filter(c => c !== currency) 
                : [...prev, currency]
        );
=======
            return acc;
        });
        updateCosts('accommodations', accommodations);
>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2
    };
    const updateRoom = (accId: string, roomId: string, field: keyof Room, value: any) => {
        const accommodations = allCosts.accommodations.map(acc => {
            if (acc.id === accId) {
                const updatedRooms = acc.rooms.map(room => room.id === roomId ? { ...room, [field]: value } : room);
                return { ...acc, rooms: updatedRooms };
            }
            return acc;
        });
        updateCosts('accommodations', accommodations);
    };
    const deleteRoom = (accId: string, roomId: string) => {
        const accommodations = allCosts.accommodations.map(acc => {
            if (acc.id === accId) {
                return { ...acc, rooms: acc.rooms.filter(room => room.id !== roomId) };
            }
            return acc;
        });
        updateCosts('accommodations', accommodations);
    };

    const addTrip = () => addItem('trips', { id: uuidv4(), location: '', route: '', vehicleType: 'ລົດຕູ້ທຳມະດາ', numVehicles: 1, numDays: 1, pricePerVehicle: 0, currency: 'USD' });
    const addFlight = () => addItem('flights', { id: uuidv4(), from: '', to: '', departureTime: '08:00', pricePerPerson: 0, numPeople: 1, currency: 'USD' });
    const addTrainTicket = () => addItem('trainTickets', { id: uuidv4(), from: '', to: '', departureTime: '08:00', ticketClass: '', numTickets: 1, pricePerTicket: 0, currency: 'LAK' });
    const addEntranceFee = () => addItem('entranceFees', { id: uuidv4(), locationName: '', pax: 1, numLocations: 1, price: 0, currency: 'LAK' });
    const addMealCost = () => addItem('meals', { id: uuidv4(), name: '', pax: 1, breakfast: 0, lunch: 0, dinner: 0, pricePerMeal: 0, currency: 'LAK' });
    const addGuideFee = () => addItem('guides', { id: uuidv4(), guideName: '', numGuides: 1, numDays: 1, pricePerDay: 0, currency: 'LAK' });
    const addDocumentFee = () => addItem('documents', { id: uuidv4(), documentName: '', pax: 1, price: 0, currency: 'LAK' });
    const addOverseasPackage = () => addItem('overseasPackages', { id: uuidv4(), name: '', priceUSD: 0, priceTHB: 0, priceCNY: 0 });
    const addActivity = () => addItem('activities', { id: uuidv4(), name: '', pax: 1, price: 0, currency: 'LAK' });

    const toggleItemVisibility = (itemId: string) => {
        setItemVisibility(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    // --- Total Calculation Memos ---
    const accommodationTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.accommodations?.forEach(acc => {
            acc.rooms.forEach(room => {
                totals[room.currency] += (room.numRooms || 0) * (room.numNights || 0) * (room.price || 0);
            });
        });
        return totals;
    }, [allCosts.accommodations]);

    const tripTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.trips?.forEach(trip => {
            totals[trip.currency] += (trip.numVehicles || 0) * (trip.numDays || 0) * (trip.pricePerVehicle || 0);
        });
        return totals;
    }, [allCosts.trips]);

    const flightTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.flights?.forEach(flight => {
            totals[flight.currency] += (flight.pricePerPerson || 0) * (flight.numPeople || 0);
        });
        return totals;
    }, [allCosts.flights]);
    
    const trainTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.trainTickets?.forEach(ticket => {
            totals[ticket.currency] += (ticket.pricePerTicket || 0) * (ticket.numTickets || 0);
        });
        return totals;
    }, [allCosts.trainTickets]);

    const entranceFeeTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.entranceFees?.forEach(fee => {
            totals[fee.currency] += (fee.pax || 0) * (fee.numLocations || 0) * (fee.price || 0);
        });
        return totals;
    }, [allCosts.entranceFees]);

    const mealTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.meals?.forEach(meal => {
            totals[meal.currency] += ((meal.breakfast || 0) + (meal.lunch || 0) + (meal.dinner || 0)) * (meal.pricePerMeal || 0) * (meal.pax || 0);
        });
        return totals;
    }, [allCosts.meals]);

    const guideTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.guides?.forEach(guide => {
            totals[guide.currency] += (guide.numGuides || 0) * (guide.numDays || 0) * (guide.pricePerDay || 0);
        });
        return totals;
    }, [allCosts.guides]);

    const documentTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.documents?.forEach(doc => {
            totals[doc.currency] += (doc.pax || 0) * (doc.price || 0);
        });
        return totals;
    }, [allCosts.documents]);

    const overseasPackageTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.overseasPackages?.forEach(pkg => {
            totals.USD += pkg.priceUSD || 0;
            totals.THB += pkg.priceTHB || 0;
            totals.CNY += pkg.priceCNY || 0;
        });
        return totals;
    }, [allCosts.overseasPackages]);
    
    const activityTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        allCosts.activities?.forEach(activity => {
            totals[activity.currency] += (activity.pax || 0) * (activity.price || 0);
        });
        return totals;
    }, [allCosts.activities]);

    const totalsByCategory = {
        'ຄ່າທີ່ພັກ': accommodationTotals,
        'ຄ່າຂົນສົ່ງ': tripTotals,
        'ຄ່າປີ້ຍົນ': flightTotals,
        'ຄ່າປີ້ລົດໄຟ': trainTotals,
        'ຄ່າເຂົ້າຊົມສະຖານທີ່': entranceFeeTotals,
        'ຄ່າອາຫານ': mealTotals,
        'ຄ່າໄກ້': guideTotals,
        'ຄ່າເອກະສານ': documentTotals,
        'ຄ່າເພັກເກດຕ່າງປະເທດ': overseasPackageTotals,
        'ຄ່າກິດຈະກຳ': activityTotals,
    };

    const grandTotals = useMemo(() => {
        const totals: Record<Currency, number> = { USD: 0, THB: 0, LAK: 0, CNY: 0 };
        Object.values(totalsByCategory).forEach(categoryTotals => {
            (Object.keys(totals) as Currency[]).forEach(currency => {
                totals[currency] += categoryTotals[currency];
            });
        });
        return totals;
    }, [totalsByCategory]);

<<<<<<< HEAD
    if (!localProgram) {
        return <div className="text-center p-8">Program not found.</div>;
    }
    
    const PrintHeader = ({ title }: { title: string }) => (
        <div className="hidden print:block print:space-y-4 pb-4 mb-4">
            <h2 className="text-lg font-bold mb-2 text-center font-lao">{title}</h2>
            <div className="grid grid-cols-2 gap-x-8 text-sm border-b-2 border-slate-300 pb-4">
                <div className="space-y-1">
                    <div className="flex justify-between"><strong className="font-semibold">Tour Program:</strong><span>{localProgram.programName}</span></div>
                    <div className="flex justify-between"><strong className="font-semibold">Tour Dates:</strong><span className="whitespace-pre-wrap text-right">{localProgram.tourDates}</span></div>
                    <div className="flex justify-between"><strong className="font-semibold">Duration:</strong><span>{localProgram.durationDays} days</span></div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between"><strong className="font-semibold">Group Code:</strong><span>{localProgram.tourCode}</span></div>
                    <div className="flex justify-between"><strong className="font-semibold">Nationality:</strong><span>{localProgram.groupName}</span></div>
                    <div className="flex justify-between"><strong className="font-semibold">Pax:</strong><span>{localProgram.pax}</span></div>
                    <div className="flex justify-between"><strong className="font-semibold">Destination:</strong><span>{localProgram.destination}</span></div>
                </div>
            </div>
            {activeTab === 'summary' && (
                <div className="hidden print:grid print:grid-cols-2 print:gap-x-8 print:text-sm print:border-b-2 print:border-slate-300 print:pb-4 print:mb-4">
                    <div>
                        <div className="flex justify-between"><strong className="font-semibold">Price:</strong><span className="font-bold">{`${formatCurrency(localProgram.price)} ${localProgram.priceCurrency}`}</span></div>
                        <div className="flex justify-between"><strong className="font-semibold">Bank Charge:</strong><span className="font-bold">{`${formatCurrency(localProgram.bankCharge)} ${localProgram.bankChargeCurrency}`}</span></div>
                    </div>
                    <div>
                        <div className="flex justify-between"><strong className="font-semibold">Total Price:</strong><span className="font-bold">{`${formatCurrency(localProgram.totalPrice)} ${localProgram.priceCurrency}`}</span></div>
                    </div>
                </div>
            )}
            {activeTab === 'summary' && (
                <>
                <div className="space-y-2">
                    <h3 className="text-base font-semibold border-b pb-1 font-lao">ລາຍຮັບ (Total Income)</h3>
                    <div className="flex justify-between text-sm pr-4">
                        <span className="font-lao">ລວມ (Total)</span>
                        <div className='flex gap-4 font-semibold'>
                            <span key={calculatedTotals.currency}>{`${formatCurrency(calculatedTotals.income)} ${calculatedTotals.currency}`}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-base font-semibold border-b pb-1 font-lao">ລາຍຈ່າຍ (Total Costs)</h3>
                    <div className="flex justify-between text-sm pr-4">
                        <span className="font-lao">ລວມ (Total)</span>
                        <div className='flex gap-4 font-semibold'>
                            <span key={calculatedTotals.currency}>{`${formatCurrency(calculatedTotals.cost)} ${calculatedTotals.currency}`}</span>
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                     <h3 className="text-base font-semibold border-b pb-1 font-lao">ກໍາໄລ/ຂາດທຶນ (Profit/Loss Summary)</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-lao">ລາຍລະອຽດ</TableHead>
                                <TableHead className="text-right">{calculatedTotals.currency}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">ລາຍຮັບລວມ</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(calculatedTotals.income)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">ຕົ້ນທຶນລວມ</TableCell>
                                <TableCell className="text-right text-red-600">{formatCurrency(calculatedTotals.cost)}</TableCell>
                            </TableRow>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>ກຳໄລ/ຂາດທຶນສຸດທິ</TableCell>
                                <TableCell className={`text-right font-bold ${calculatedTotals.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {formatCurrency(calculatedTotals.profit)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                     </Table>
                </div>
                </>
            )}
        </div>
    );
    
    const ProgramInfoCard = () => {
        const createdAtDate = toDateSafe(localProgram.createdAt);
        return (
             <Card className="print:hidden">
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle>ລາຍລະອຽດໂປຣແກຣມ และ ຂໍ້ມູນກຸ່ມ</CardTitle>
                        <CardDescription>
                            ວັນທີສ້າງ: {createdAtDate ? format(createdAtDate, "PPP", {locale: th}) : '-'}
                            {isSaving && <span className="ml-4 text-blue-500 animate-pulse">ກຳລັງບັນທຶກ...</span>}
                        </CardDescription>
                    </div>
                    <Button onClick={handleSaveProgramInfo} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'ກຳລັງບັນທຶກ' : 'ບັນທຶກການປ່ຽນແປງ'}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3">
                             <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-semibold w-1/4">ຊື່ໂປຣແກຣມ</TableCell>
                                        <TableCell>
                                            <Input id="programName" value={localProgram.programName || ''} onChange={(e) => handleProgramChange('programName', e.target.value)} />
                                        </TableCell>
                                        <TableCell className="font-semibold w-1/4">ລະຫັດກຸ່ມ</TableCell>
                                        <TableCell>
                                             <Input id="tourCode" value={localProgram.tourCode || ''} onChange={(e) => handleProgramChange('tourCode', e.target.value)} />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-semibold">ສັນຊາດ</TableCell>
                                        <TableCell>
                                            <Input id="groupName" value={localProgram.groupName || ''} onChange={(e) => handleProgramChange('groupName', e.target.value)} />
                                        </TableCell>
                                        <TableCell className="font-semibold">ຈຳນວນຄົນ</TableCell>
                                        <TableCell>
                                            <Input id="pax" type="number" value={localProgram.pax || ''} onChange={(e) => handleProgramChange('pax', Number(e.target.value) || 0)} />
                                        </TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell className="font-semibold">ຈຸດໝາຍ</TableCell>
                                        <TableCell>
                                            <Input id="destination" value={localProgram.destination || ''} onChange={(e) => handleProgramChange('destination', e.target.value)} />
                                        </TableCell>
                                        <TableCell className="font-semibold">ໄລຍະເວລາ (ວັນ)</TableCell>
                                        <TableCell>
                                            <Input id="durationDays" type="number" value={localProgram.durationDays || ''} onChange={(e) => handleProgramChange('durationDays', Number(e.target.value) || 0)} />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                         <TableCell className="font-semibold align-top">ວັນທີເດີນທາງ</TableCell>
                                        <TableCell colSpan={3}>
                                            <Textarea id="tourDates" value={localProgram.tourDates || ''} onChange={(e) => handleProgramChange('tourDates', e.target.value)} />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-semibold">ລາຄາ</TableCell>
                                        <TableCell>
                                            <CurrencyInput 
                                                label="Price"
                                                amount={localProgram.price}
                                                currency={localProgram.priceCurrency}
                                                onAmountChange={(v) => handleProgramChange('price', v)}
                                                onCurrencyChange={(v) => handleProgramChange('priceCurrency', v)}
                                             />
                                        </TableCell>
                                         <TableCell className="font-semibold">ຄ່າທຳນຽມທະນາຄານ</TableCell>
                                        <TableCell>
                                            <CurrencyInput 
                                                label="Bank Charge"
                                                amount={localProgram.bankCharge}
                                                currency={localProgram.bankChargeCurrency}
                                                onAmountChange={(v) => handleProgramChange('bankCharge', v)}
                                                onCurrencyChange={(v) => handleProgramChange('bankChargeCurrency', v)}
                                             />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
=======
    const date = toDateSafe(tourInfo.date);
>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2

    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-background px-4 shadow-md">
                <Link href="/tour-programs" className="hover:opacity-75 transition-opacity">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-lg font-semibold">ໂປຣແກຣມທົວ: {tourInfo.programName || "ຍັງບໍ່ມີຊື່"}</h1>
                <div className="ml-auto flex items-center gap-4">
                    <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> ພິມ</Button>
                    <Button onClick={handleSaveProgram}><Save className="mr-2 h-4 w-4" /> ບັນທຶກ</Button>
                    <Button variant="destructive" onClick={handleDeleteProgram}><Trash2 className="mr-2 h-4 w-4" /> ລຶບ</Button>
                </div>
<<<<<<< HEAD
                ))}
            </div>
            <Button onClick={handlePrint} size="sm" variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                ພິມ
            </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 print:p-2 print:gap-1">
        <Tabs defaultValue="info" onValueChange={(v) => setActiveTab(v as TabValue)} className="mt-4">
          <TabsList className="grid w-full grid-cols-5 print:hidden">
              <TabsTrigger value="info">ຂໍ້ມູນໂປຣແກຣມ</TabsTrigger>
              <TabsTrigger value="income">ບັນທຶກລາຍຮັບ</TabsTrigger>
              <TabsTrigger value="costs">ຄຳນວນຕົ້ນທຶນ</TabsTrigger>
              <TabsTrigger value="summary">ສະຫຼຸບຜົນ</TabsTrigger>
              <TabsTrigger value="dividend">ປັນຜົນ</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="mt-4">
              <ProgramInfoCard />
          </TabsContent>
          <TabsContent value="income" className="mt-4">
               <div className={activeTab === 'income' ? 'block' : 'hidden'}>
                  <PrintHeader title="ລາຍຮັບ (Total Income)" />
                  <CurrencyEntryTable 
                      items={incomeItems}
                      onAddItem={handleAddIncomeItem}
                      onUpdateItem={handleUpdateIncomeItem}
                      onDeleteItem={handleDeleteIncomeItem}
                      title="ຕາຕະລາງບັນທຶກລາຍຮັບ"
                      description="ບັນທຶກລາຍຮັບທັງໝົດຂອງໂປຣແກຣມນີ້"
                      onSave={handleSaveIncomeItems}
                      isSaving={isTableSaving}
                  />
              </div>
          </TabsContent>
          <TabsContent value="costs" className="mt-4">
               <div className={activeTab === 'costs' ? 'block' : 'hidden'}>
                  <PrintHeader title="ລາຍຈ່າຍ (Total Costs)" />
                  <CurrencyEntryTable 
                      items={costItems}
                      onAddItem={handleAddCostItem}
                      onUpdateItem={handleUpdateCostItem}
                      onDeleteItem={handleDeleteCostItem}
                      title="ຕາຕະລາງຄຳນວນຕົ້ນທຶນ"
                      description="ບັນທຶກຄ່າໃຊ້ຈ່າຍທັງໝົດຂອງໂປຣແກຣມນີ້"
                      onSave={handleSaveCostItems}
                      isSaving={isTableSaving}
                  />
              </div>
          </TabsContent>
          <TabsContent value="summary" className="mt-4">
                <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
                    <PrintHeader title="ສະຫຼຸບໂປຣແກມທົວ (Tour Program Summary)" />
                </div>
              <Card className="print:hidden">
                  <CardHeader>
                      <CardTitle>ສະຫຼຸບຜົນປະກອບການ</CardTitle>
                      <CardDescription>ສະຫຼຸບລາຍຮັບ, ຕົ້ນທຶນ, และกำไร/ขาดทุน ສຳລັບໂປຣແກຣມນີ້</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 print:p-0 print:space-y-2">
                      
                       <div>
                          <h3 className="text-lg font-semibold mb-2 print:font-lao print:text-sm print:font-bold print:border-b print:pb-1">ລາຍຮັບ (Total Income)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                              <SummaryCard title="ລາຍຮັບ" value={summaryData.totalIncomes.LAK} currency="LAK" />
                              <SummaryCard title="ລາຍຮັບ" value={summaryData.totalIncomes.THB} currency="THB" />
                              <SummaryCard title="ລາຍຮັບ" value={summaryData.totalIncomes.USD} currency="USD" />
                              <SummaryCard title="ລາຍຮັບ" value={summaryData.totalIncomes.CNY} currency="CNY" />
                          </div>
                      </div>
                      <div>
                          <h3 className="text-lg font-semibold mb-2 print:font-lao print:text-sm print:font-bold print:border-b print:pb-1">ລາຍຈ່າຍ (Total Costs)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                              <SummaryCard title="ຕົ້ນທຶນ" value={summaryData.totalCosts.LAK} currency="LAK" />
                              <SummaryCard title="ຕົ້ນທຶນ" value={summaryData.totalCosts.THB} currency="THB" />
                              <SummaryCard title="ຕົ້ນທຶນ" value={summaryData.totalCosts.USD} currency="USD" />
                              <SummaryCard title="ຕົ້ນທຶນ" value={summaryData.totalCosts.CNY} currency="CNY" />
                          </div>
                      </div>
                      <ExchangeRateCard 
                            totalIncome={summaryData.totalIncomes}
                            totalCost={summaryData.totalCosts}
                            rates={exchangeRates} 
                            onRatesChange={handleRatesChange}
                            onCalculatedTotalsChange={handleCalculatedTotalsChange}
                        />
                  </CardContent>
              </Card>
          </TabsContent>
           <TabsContent value="dividend" className="mt-4">
              <Card>
                  <CardHeader>
                      <CardTitle>ການແບ່ງປັນຜົນກຳໄລ (ປັນຜົນ)</CardTitle>
                      <CardDescription>
                          ຄຳນວນ ແລະ ຈັດການການປັນຜົນຂອງໂປຣແກຣມນີ້.
                      </CardDescription>
                        <div className="pt-2 text-sm text-muted-foreground space-y-1">
                            <p><span className="font-semibold">Group Code:</span> {localProgram.tourCode}</p>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="dividend-currency" className="font-semibold">ກຳໄລ:</Label>
                                <Select value={dividendCurrency} onValueChange={(v) => setDividendCurrency(v as Currency)}>
                                    <SelectTrigger className="w-[120px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <span className={`font-bold text-lg ${totalProfitInSelectedCurrency >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(totalProfitInSelectedCurrency)}
                                </span>
                            </div>
                        </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">ຜູ້ຮັບຜົນປະໂຫຍດ</TableHead>
                                <TableHead className="w-[120px] text-center">ເປີເຊັນ (%)</TableHead>
                                <TableHead className="text-right">ປັນຜົນ ({dividendCurrency})</TableHead>
                                <TableHead className="w-[50px] print:hidden"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dividendStructure.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium p-1">
                                        <Textarea 
                                            value={item.name} 
                                            onChange={(e) => handleDividendChange(item.id, 'name', e.target.value)}
                                            className="h-8 min-h-[32px]"
                                        />
                                    </TableCell>
                                    <TableCell className="text-center p-1">
                                         <Input 
                                            type="number"
                                            value={item.percentage * 100} 
                                            onChange={(e) => handleDividendChange(item.id, 'percentage', e.target.value)}
                                            className="h-8 text-center"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-mono p-1">
                                        {formatCurrency(totalProfitInSelectedCurrency * item.percentage)}
                                    </TableCell>
                                    <TableCell className="p-1 print:hidden">
                                        <Button variant="ghost" size="icon" onClick={() => removeDividendRow(item.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-muted font-bold">
                                <TableCell>ລວມທັງໝົດ</TableCell>
                                <TableCell className="text-center">{formatCurrency(totalPercentage * 100)}%</TableCell>
                                <TableCell className="text-right font-mono">
                                     {formatCurrency(totalProfitInSelectedCurrency * totalPercentage)}
                                </TableCell>
                                <TableCell className="print:hidden"></TableCell>
                            </TableRow>
                        </TableFooter>
                      </Table>
                      <div className="flex justify-start print:hidden">
                          <Button onClick={addDividendRow} variant="outline">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              ເພີ່ມລາຍການ
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          </TabsContent>
      </Tabs>
      </main>
    </div>
  )
}
=======
            </header>
            <main className="flex-1 space-y-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>ຂໍ້ມູນທົ່ວໄປ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">ວັນທີ</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "dd/MM/yyyy") : <span>ເລືອກວັນທີ</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date || undefined} onSelect={d => setTourInfo({ ...tourInfo, date: d?.toISOString() })} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tourCode">ລະຫັດທົວ</Label>
                                <Input id="tourCode" placeholder="ລະຫັດທົວ" value={tourInfo.tourCode} onChange={e => setTourInfo({ ...tourInfo, tourCode: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="programName">ຊື່ໂປຣແກຣມ</Label>
                                <Input id="programName" placeholder="ຊື່ໂປຣແກຣມ" value={tourInfo.programName} onChange={e => setTourInfo({ ...tourInfo, programName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="groupName">ຊື່ກຸ່ມ</Label>
                                <Input id="groupName" placeholder="ຊື່ກຸ່ມ" value={tourInfo.groupName} onChange={e => setTourInfo({ ...tourInfo, groupName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destination">ຈຸດໝາຍປາຍທາງ</Label>
                                <Input id="destination" placeholder="ຈຸດໝາຍປາຍທາງ" value={tourInfo.destination} onChange={e => setTourInfo({ ...tourInfo, destination: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tourDates">ວັນທີເດີນທາງ</Label>
                                <Input id="tourDates" placeholder="ຕົວຢ່າງ: 01-05/01/2025" value={tourInfo.tourDates} onChange={e => setTourInfo({ ...tourInfo, tourDates: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numDays">ຈຳນວນມື້</Label>
                                <Input type="number" id="numDays" placeholder="ຈຳນວນມື້" value={tourInfo.durationDays} onChange={e => setTourInfo({ ...tourInfo, durationDays: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pax">ຈຳນວນ</Label>
                                <Input type="number" id="pax" placeholder="ຈຳນວນ" value={tourInfo.pax} onChange={e => setTourInfo({ ...tourInfo, pax: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Other cards can be added here as needed */}
            </main>
        </div>
    );
}
>>>>>>> 12728d97b028c2558a1c98dfc692eb989169bec2
