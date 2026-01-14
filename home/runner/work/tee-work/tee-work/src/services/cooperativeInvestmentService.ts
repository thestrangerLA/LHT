
import { db } from '@/lib/firebase';
import type { CooperativeInvestment, CurrencyValues } from '@/lib/types';
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
    Timestamp
} from 'firebase/firestore';

const investmentsCollectionRef = collection(db, 'cooperativeInvestments');

const initialCurrencyValues: Omit<CurrencyValues, 'cny'> = { kip: 0, thb: 0, usd: 0 };


export const listenToCooperativeInvestments = (callback: (items: CooperativeInvestment[]) => void) => {
    const q = query(investmentsCollectionRef, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const investments: CooperativeInvestment[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            investments.push({ 
                id: doc.id, 
                ...data,
                date: (data.date as Timestamp)?.toDate(),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                amount: data.amount || { ...initialCurrencyValues }
            } as CooperativeInvestment);
        });
        callback(investments);
    });
    return unsubscribe;
};

export const addCooperativeInvestment = async (investment: Omit<CooperativeInvestment, 'id' | 'createdAt'>) => {
    const investmentWithTimestamp = {
        ...investment,
        date: Timestamp.fromDate(investment.date),
        createdAt: serverTimestamp()
    };
    await addDoc(investmentsCollectionRef, investmentWithTimestamp);
};

export const updateCooperativeInvestment = async (id: string, updatedFields: Partial<Omit<CooperativeInvestment, 'id' | 'createdAt'>>) => {
    const investmentDoc = doc(db, 'cooperativeInvestments', id);
    
    const dataToUpdate: any = { ...updatedFields };
    if (updatedFields.date && updatedFields.date instanceof Date) {
        dataToUpdate.date = Timestamp.fromDate(updatedFields.date);
    }
    await updateDoc(investmentDoc, dataToUpdate);
};

export const deleteCooperativeInvestment = async (id: string) => {
    const investmentDoc = doc(db, 'cooperativeInvestments', id);
    await deleteDoc(investmentDoc);
};
