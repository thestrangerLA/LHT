
import { db } from '@/lib/firebase';
import type { Transaction } from '@/lib/types';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const transactionsCollectionRef = collection(db, 'sps-meat-business-transactions');

export const listenToAllSpsMeatTransactions = (
    callback: (items: Transaction[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(transactionsCollectionRef, ...safeOrderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({ 
                id: doc.id, 
                ...data,
                date: toDateSafe(data.date) || new Date(),
                amount: data.kip || 0 // Use 'kip' field as 'amount'
            } as Transaction);
        });
        callback(transactions);
    },
    (error) => {
        console.error("Error in SPS meat transaction listener:", error);
        if (onError) {
            onError(error);
        }
    });
    return unsubscribe;
};
