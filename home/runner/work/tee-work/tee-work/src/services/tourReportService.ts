
import { db } from '@/lib/firebase';
import type { TourCostItem, TourIncomeItem, TourProgram } from '@/lib/types';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const programsCollectionRef = collection(db, 'tourPrograms');
const costsCollectionRef = collection(db, 'tourCostItems');
const incomeCollectionRef = collection(db, 'tourIncomeItems');

export const listenToAllTourPrograms = (callback: (items: TourProgram[]) => void) => {
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
            } as TourProgram);
        });
        callback(items);
    });
    return unsubscribe;
};

export const listenToAllTourCostItems = (callback: (items: TourCostItem[]) => void) => {
    const q = query(costsCollectionRef, ...safeOrderBy('createdAt', 'desc'));
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
        callback(items);
    });
    return unsubscribe;
};


export const listenToAllTourIncomeItems = (callback: (items: TourIncomeItem[]) => void) => {
    const q = query(incomeCollectionRef, ...safeOrderBy('createdAt', 'desc'));
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
        callback(items);
    });
    return unsubscribe;
};
