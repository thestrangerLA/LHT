
import { db } from '@/lib/firebase';
import type { TourCostItem, TourProgram, TourIncomeItem } from '@/lib/types';
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
                date: toDateSafe(data.date),
                createdAt: toDateSafe(data.createdAt)
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
        } as TourProgram)
    });
    return programs;
}

export const getTourProgram = async (id: string): Promise<TourProgram | null> => {
    const docRef = doc(db, 'tourPrograms', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            date: toDateSafe(data.date)!,
            createdAt: toDateSafe(data.createdAt)!,
        } as TourProgram;
    } else {
        return null;
    }
}

export const addTourProgram = async (program: Omit<TourProgram, 'id' | 'createdAt'>): Promise<string> => {
    const newProgram = {
        ...program,
        tourDates: program.tourDates || '',
        date: Timestamp.fromDate(program.date),
        createdAt: serverTimestamp()
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
                createdAt: toDateSafe(data.createdAt)
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
                createdAt: toDateSafe(data.createdAt)
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
