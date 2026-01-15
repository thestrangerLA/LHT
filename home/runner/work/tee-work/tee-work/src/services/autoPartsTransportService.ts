

import { db } from '@/lib/firebase';
import type { TransportEntry } from '@/lib/types';
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
    writeBatch
} from 'firebase/firestore';
import { startOfDay } from 'date-fns';
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const transportCollectionRef = collection(db, 'autoparts-transportEntries');

export const listenToAutoPartsTransportEntries = (callback: (items: TransportEntry[]) => void) => {
    const q = query(transportCollectionRef, ...safeOrderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const entries: TransportEntry[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            entries.push({ 
                id: doc.id, 
                ...data,
                date: toDateSafe(data.date) || new Date(),
                createdAt: toDateSafe(data.createdAt) || new Date()
            } as TransportEntry);
        });
        // Sort by date and then by order on the client side
        entries.sort((a, b) => {
            if (a.date.getTime() !== b.date.getTime()) {
                return b.date.getTime() - a.date.getTime();
            }
            return (a.order || 0) - (b.order || 0);
        });
        callback(entries);
    });
    return unsubscribe;
};

export const addMultipleAutoPartsTransportEntries = async (entries: Omit<TransportEntry, 'id'|'createdAt'|'date'|'type'|'sender'>[], entryDate: Date, company: 'ANS' | 'HAL' | 'MX' | 'NH', order: number, sender: 'Tee' | 'YU') => {
    const batch = writeBatch(db);
    const date = startOfDay(entryDate);

    entries.forEach(entry => {
        const docRef = doc(transportCollectionRef);
        batch.set(docRef, {
            ...entry,
            date: Timestamp.fromDate(date),
            type: company,
            order: order,
            sender: sender,
            createdAt: serverTimestamp(),
        });
    });

    await batch.commit();
}

export const updateAutoPartsTransportEntry = async (id: string, updatedFields: Partial<Omit<TransportEntry, 'id' | 'createdAt'>>) => {
    const transportDoc = doc(db, 'autoparts-transportEntries', id);
    
    const dataToUpdate: any = { ...updatedFields };
    if (updatedFields.date && updatedFields.date instanceof Date) {
        dataToUpdate.date = Timestamp.fromDate(updatedFields.date);
    }
    await updateDoc(transportDoc, dataToUpdate);
};

export const deleteAutoPartsTransportEntry = async (id: string) => {
    const transportDoc = doc(db, 'autoparts-transportEntries', id);
    await deleteDoc(transportDoc);
};
