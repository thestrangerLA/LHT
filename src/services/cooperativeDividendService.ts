
import { db } from '@/lib/firebase';
import type { DividendItem } from '@/lib/types';
import { 
    doc, 
    onSnapshot, 
    setDoc,
    getDoc,
} from 'firebase/firestore';

const dividendDocRef = doc(db, 'cooperativeDividendStructure', 'latest');

const initialDividendStructure: DividendItem[] = [
    { id: '1', name: 'ສະມາຊິກ', percentage: 0.40 },
    { id: '2', name: 'ສະຫະກອນ', percentage: 0.40 },
    { id: '3', name: 'ງານສັງຄົມ', percentage: 0.20 },
];

const ensureInitialState = async () => {
    const docSnap = await getDoc(dividendDocRef);
    if (!docSnap.exists()) {
        await setDoc(dividendDocRef, { structure: initialDividendStructure });
    }
};

export const listenToCooperativeDividendStructure = (callback: (structure: DividendItem[]) => void) => {
    ensureInitialState();
    
    const unsubscribe = onSnapshot(dividendDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (Array.isArray(data.structure)) {
                callback(data.structure);
            } else {
                callback(initialDividendStructure);
            }
        } else {
            callback(initialDividendStructure);
        }
    });
    return unsubscribe;
};

export const updateCooperativeDividendStructure = async (structure: DividendItem[]) => {
    await setDoc(dividendDocRef, { structure });
};
