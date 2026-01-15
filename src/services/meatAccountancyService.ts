
import { db } from '@/lib/firebase';
import type { DocumentAccountSummary, Transaction } from '@/lib/types';
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
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const summaryDocRef = doc(db, 'meat-business-accountSummary', 'latest');
const transactionsCollectionRef = collection(db, 'meat-business-transactions');

const initialSummaryState: Omit<DocumentAccountSummary, 'id'> = {
    capital: 0,
    cash: 0,
    transfer: 0,
};

// Function to ensure an initial state exists
const ensureInitialState = async () => {
    const docSnap = await getDoc(summaryDocRef);
    if (!docSnap.exists()) {
        await setDoc(summaryDocRef, initialSummaryState);
    }
};

export const listenToMeatAccountSummary = (callback: (summary: DocumentAccountSummary) => void) => {
    ensureInitialState();
    
    const unsubscribe = onSnapshot(summaryDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            callback({
                id: docSnapshot.id,
                capital: data.capital || 0,
                cash: data.cash || 0,
                transfer: data.transfer || 0,
            });
        } else {
            callback({ id: 'latest', ...initialSummaryState } as DocumentAccountSummary);
        }
    });
    return unsubscribe;
};

export const updateMeatAccountSummary = async (summary: Partial<Omit<DocumentAccountSummary, 'id'>>) => {
    await setDoc(summaryDocRef, summary, { merge: true });
};


// Transaction Functions
export const listenToMeatTransactions = (callback: (items: Transaction[]) => void) => {
    const q = query(transactionsCollectionRef, ...safeOrderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({ 
                id: doc.id, 
                ...data,
                date: toDateSafe(data.date) || new Date(),
                amount: data.kip || 0
            } as Transaction);
        });
        callback(transactions);
    });
    return unsubscribe;
};

export const addMeatTransaction = async (transaction: Omit<Transaction, 'id' | 'businessType'>) => {
    const newTransactionRef = doc(transactionsCollectionRef);
    await setDoc(newTransactionRef, { 
        description: transaction.description,
        type: transaction.type,
        kip: transaction.amount,
        businessType: 'meat-business',
        date: Timestamp.fromDate(transaction.date),
        createdAt: serverTimestamp()
    });
};

export const updateMeatTransaction = async (id: string, updatedFields: Partial<Omit<Transaction, 'id'>>) => {
    const transactionDocRef = doc(transactionsCollectionRef, id);
    const dataToUpdate: any = {
        description: updatedFields.description,
        type: updatedFields.type,
        kip: updatedFields.amount,
    };
    if (updatedFields.date) {
        dataToUpdate.date = Timestamp.fromDate(updatedFields.date);
    }
    await updateDoc(transactionDocRef, dataToUpdate);
};

export const deleteMeatTransaction = async (id: string) => {
    const transactionDocRef = doc(transactionsCollectionRef, id);
    await deleteDoc(transactionDocRef);
};
