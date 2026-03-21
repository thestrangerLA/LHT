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

    const updateCosts = useCallback((category: keyof TourCosts, data: any[]) => {
        setAllCosts(prev => ({ ...prev, [category]: data }));
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
            return acc;
        });
        updateCosts('accommodations', accommodations);
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

    const date = toDateSafe(tourInfo.date);

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