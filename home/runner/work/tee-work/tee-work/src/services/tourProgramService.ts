
import { db } from '@/lib/firebase';
import type { TourCostItem, TourProgram, TourIncomeItem, ExchangeRates } from '@/lib/types';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    doc, 
    updateDoc, 
    deleteDoc, 
    orderBy,
    serverTimestamp,
    Timestamp,
    where,
    getDoc,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const programsCollectionRef = collection(db, 'tourPrograms');
const costsCollectionRef = collection(db, 'tourCostItems');
const incomeCollectionRef = collection(db, 'tourIncomeItems');

const initialRates: ExchangeRates = {
    USD: { THB: 38, LAK: 25000, CNY: 8 },
    THB: { USD: 0.032, LAK: 700, CNY: 0.25 },
    CNY: { USD: 0.20, THB: 6, LAK: 3500 },
    LAK: { USD: 0.00005, THB: 0.0015, CNY: 0.00035 },
};

// ---- Tour Program Functions ----

export const listenToTourPrograms = (callback: (items: TourProgram[]) => void) => {
    const q = query(programsCollectionRef, ...safeOrderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: TourProgram[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                date: toDateSafe(data.date) || new Date(),
                createdAt: toDateSafe(data.createdAt) || new Date(),
                exchangeRates: data.exchangeRates || initialRates,
            } as TourProgram);
        });
        callback(items);
    });
    return unsubscribe;
};

export const getAllTourProgramIds = async (): Promise<{ id: string }[]> => {
    const q = query(programsCollectionRef);
    const querySnapshot = await getDocs(q);
    const ids = querySnapshot.docs.map(doc => ({ id: doc.id }));
    if (ids.length === 0) {
        // Fallback for build if no programs exist to prevent build failure.
        return [{ id: 'default' }];
    }
    return ids;
}

export const getAllTourPrograms = async (): Promise<TourProgram[]> => {
    const q = query(programsCollectionRef);
    const querySnapshot = await getDocs(q);
    const programs: TourProgram[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        programs.push({
             id: doc.id,
            ...data,
            date: toDateSafe(data.date)!,
            createdAt: toDateSafe(data.createdAt)!,
            exchangeRates: data.exchangeRates || initialRates,
        } as TourProgram)
    });
    return programs;
}

export const getTourProgram = async (id: string): Promise<any | null> => {
    if (id === 'default') {
        return null;
    }
    const docRef = doc(db, 'tourPrograms', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();

        // If data already has tourInfo, it's the new nested format.
        if (data.tourInfo) {
            const tourInfo = data.tourInfo || {};
            if (tourInfo.startDate) tourInfo.startDate = toDateSafe(tourInfo.startDate)?.toISOString() || null;
            if (tourInfo.endDate) tourInfo.endDate = toDateSafe(tourInfo.endDate)?.toISOString() || null;

            return {
                id: docSnap.id,
                ...data,
                tourInfo,
                savedAt: toDateSafe(data.savedAt),
            };
        }

        // If not, it's the old flat format. Convert it to the nested structure.
        const flatProgram = data as TourProgram;
        return {
            id: docSnap.id,
            tourInfo: {
                tourCode: flatProgram.tourCode || '',
                programName: flatProgram.programName || '',
                groupName: flatProgram.groupName || '',
                pax: flatProgram.pax || 0,
                destination: flatProgram.destination || '',
                tourDates: flatProgram.tourDates || '',
                durationDays: flatProgram.durationDays || 0,
                date: toDateSafe(flatProgram.date),
                price: flatProgram.price || 0,
                priceCurrency: flatProgram.priceCurrency || 'LAK',
                bankCharge: flatProgram.bankCharge || 0,
                bankChargeCurrency: flatProgram.bankChargeCurrency || 'LAK',
                totalPrice: flatProgram.totalPrice || 0,
            },
            allCosts: { // Provide empty costs structure for compatibility
                accommodations: [], trips: [], flights: [], trainTickets: [],
                entranceFees: [], meals: [], guides: [], documents: [], overseasPackages: [], activities: []
            },
            exchangeRates: flatProgram.exchangeRates || initialRates,
            profitPercentage: 20, // Default profit percentage
            savedAt: toDateSafe(flatProgram.createdAt)
        };
    } else {
        return null;
    }
}

export const addTourProgram = async (program: Omit<TourProgram, 'id' | 'createdAt'>): Promise<string> => {
    const newProgram = {
        ...program,
        tourDates: program.tourDates || '',
        date: Timestamp.fromDate(program.date),
        createdAt: serverTimestamp(),
        exchangeRates: program.exchangeRates || initialRates,
    };
    const docRef = await addDoc(programsCollectionRef, newProgram);
    return docRef.id;
};

export const updateTourProgram = async (id: string, updatedFields: Partial<Omit<TourProgram, 'id' | 'createdAt'>>) => {
    const programDoc = doc(db, 'tourPrograms', id);
    const dataToUpdate: any = { ...updatedFields };
    if (updatedFields.date && updatedFields.date instanceof Date) {
        dataToUpdate.date = Timestamp.fromDate(updatedFields.date as Date);
    }
    await updateDoc(programDoc, dataToUpdate);
};

export const deleteTourProgram = async (programId: string) => {
    const batch = writeBatch(db);

    // 1. Delete the program itself
    const programDocRef = doc(db, 'tourPrograms', programId);
    batch.delete(programDocRef);

    // 2. Query and delete all associated cost items
    const costsQuery = query(costsCollectionRef, where('programId', '==', programId));
    const costsSnapshot = await getDocs(costsQuery);
    costsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // 3. Query and delete all associated income items
    const incomesQuery = query(incomeCollectionRef, where('programId', '==', programId));
    const incomesSnapshot = await getDocs(incomesQuery);
    incomesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();
};


// ---- Tour Cost Item Functions ----

export const listenToTourCostItemsForProgram = (programId: string, callback: (items: TourCostItem[]) => void) => {
    const q = query(costsCollectionRef, where('programId', '==', programId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: TourCostItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                date: toDateSafe(data.date) || null,
                createdAt: toDateSafe(data.createdAt) || new Date(),
            } as TourCostItem);
        });
        items.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
        callback(items);
    });
    return unsubscribe;
};

export const addTourCostItem = async (programId: string) => {
    const newItem: Omit<TourCostItem, 'id' | 'createdAt'> = {
        programId: programId,
        date: new Date(),
        detail: '',
        lak: 0,
        thb: 0,
        usd: 0,
        cny: 0,
    };
    await addDoc(costsCollectionRef, {
        ...newItem,
        createdAt: serverTimestamp()
    });
};

export const updateTourCostItem = async (id: string, updatedFields: Partial<Omit<TourCostItem, 'id' | 'createdAt'>>) => {
    const itemDoc = doc(db, 'tourCostItems', id);
    const dataToUpdate: any = { ...updatedFields };
    if (updatedFields.date && updatedFields.date instanceof Date) {
        dataToUpdate.date = Timestamp.fromDate(updatedFields.date as Date);
    }
    await updateDoc(itemDoc, dataToUpdate);
};

export const deleteTourCostItem = async (id: string) => {
    const itemDoc = doc(db, 'tourCostItems', id);
    await deleteDoc(itemDoc);
};


// ---- Tour Income Item Functions ----

export const listenToTourIncomeItemsForProgram = (programId: string, callback: (items: TourIncomeItem[]) => void) => {
    const q = query(incomeCollectionRef, where('programId', '==', programId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: TourIncomeItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                date: toDateSafe(data.date) || null,
                createdAt: toDateSafe(data.createdAt) || new Date(),
            } as TourIncomeItem);
        });
        items.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
        callback(items);
    });
    return unsubscribe;
};

export const addTourIncomeItem = async (programId: string) => {
    const newItem: Omit<TourIncomeItem, 'id' | 'createdAt'> = {
        programId: programId,
        date: new Date(),
        detail: '',
        lak: 0,
        thb: 0,
        usd: 0,
        cny: 0,
    };
    await addDoc(incomeCollectionRef, {
        ...newItem,
        createdAt: serverTimestamp()
    });
};

export const updateTourIncomeItem = async (id: string, updatedFields: Partial<Omit<TourIncomeItem, 'id' | 'createdAt'>>) => {
    const itemDoc = doc(db, 'tourIncomeItems', id);
    const dataToUpdate: any = { ...updatedFields };
    if (updatedFields.date && updatedFields.date instanceof Date) {
        dataToUpdate.date = Timestamp.fromDate(updatedFields.date as Date);
    }
    await updateDoc(itemDoc, dataToUpdate);
};

export const deleteTourIncomeItem = async (id: string) => {
    const itemDoc = doc(db, 'tourIncomeItems', id);
    await deleteDoc(itemDoc);
};

interface SavedCalculation {
    id: string;
    savedAt: any;
    tourInfo: any;
    allCosts: any;
    exchangeRates?: any;
    profitPercentage?: number;
}
