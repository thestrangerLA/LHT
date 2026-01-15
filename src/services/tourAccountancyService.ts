
import { db } from '@/lib/firebase';
import type { TourAccountSummary, Transaction, CurrencyValues } from '@/lib/types';
import { 
    doc, 
    onSnapshot, 
    setDoc,
    getDoc,
    collection,
    query,
    orderBy,
    addDoc,
    Timestamp,
    runTransaction,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const summaryDocRef = doc(db, 'tour-accountSummary', 'latest');
const transactionsCollectionRef = collection(db, 'tour-transactions');

const initialCurrencyValues: CurrencyValues = { kip: 0, baht: 0, usd: 0, cny: 0 };

const initialSummaryState: Omit<TourAccountSummary, 'id'> = {
    capital: { ...initialCurrencyValues },
    cash: { ...initialCurrencyValues },
    transfer: { ...initialCurrencyValues },
};

// Function to ensure an initial state exists
const ensureInitialState = async () => {
    const docSnap = await getDoc(summaryDocRef);
    if (!docSnap.exists()) {
        await setDoc(summaryDocRef, initialSummaryState);
    }
};

export const listenToTourAccountSummary = (callback: (summary: TourAccountSummary) => void) => {
    ensureInitialState();
    
    const unsubscribe = onSnapshot(summaryDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            callback({
                id: docSnapshot.id,
                capital: data.capital || { ...initialCurrencyValues },
                cash: data.cash || { ...initialCurrencyValues },
                transfer: data.transfer || { ...initialCurrencyValues },
            });
        } else {
            callback({ id: 'latest', ...initialSummaryState });
        }
    });
    return unsubscribe;
};

export const updateTourAccountSummary = async (summary: Partial<Omit<TourAccountSummary, 'id'>>) => {
    await setDoc(summaryDocRef, summary, { merge: true });
};


// Transaction Functions
export const listenToTourTransactions = (
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
                date: toDateSafe(data.date)
            } as Transaction);
        });
        callback(transactions);
    },
    (error) => {
        console.error("Error in transaction listener:", error);
        if (onError) {
            onError(error);
        }
    });
    return unsubscribe;
};

export const addTourTransaction = async (transaction: Omit<Transaction, 'id' | 'businessType' | 'amount'> & { kip?: number; baht?: number; usd?: number; cny?: number; }) => {
    const newTransactionRef = doc(transactionsCollectionRef);
    await setDoc(newTransactionRef, { 
        ...transaction, 
        businessType: 'tour',
        date: Timestamp.fromDate(transaction.date),
        createdAt: serverTimestamp()
    });
};


export const updateTourTransaction = async (id: string, updatedFields: Partial<Omit<Transaction, 'id'>>) => {
    const transactionDocRef = doc(transactionsCollectionRef, id);
    const updateDataForFirestore: { [key: string]: any } = { ...updatedFields };
    if (updatedFields.date) {
        updateDataForFirestore.date = Timestamp.fromDate(updatedFields.date);
    }
    await updateDoc(transactionDocRef, updateDataForFirestore);
};

export const deleteTourTransaction = async (id: string) => {
    const transactionDocRef = doc(transactionsCollectionRef, id);
    await deleteDoc(transactionDocRef);
};
