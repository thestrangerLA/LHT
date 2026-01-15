
import { db } from '@/lib/firebase';
import type { MeatStockItem, MeatStockLog } from '@/lib/types';
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
    runTransaction,
    writeBatch,
    where,
    getDocs,
    getDoc,
    increment
} from 'firebase/firestore';
import { format } from 'date-fns';
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const meatStockCollectionRef = collection(db, 'meatStockItems');
const meatStockLogCollectionRef = collection(db, 'meatStockLogs');

export const listenToMeatStockItems = (callback: (items: MeatStockItem[]) => void) => {
    const q = query(meatStockCollectionRef, ...safeOrderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: MeatStockItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                createdAt: toDateSafe(data.createdAt)
            } as MeatStockItem);
        });
        callback(items);
    });
    return unsubscribe;
};

export const listenToMeatStockItem = (id: string, callback: (item: MeatStockItem | null) => void) => {
    const itemDocRef = doc(db, 'meatStockItems', id);
    const unsubscribe = onSnapshot(itemDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            callback({
                id: docSnapshot.id,
                ...data,
                createdAt: toDateSafe(data.createdAt)
            } as MeatStockItem);
        } else {
            callback(null);
        }
    });
    return unsubscribe;
};

export const listenToAllMeatStockLogs = (callback: (logs: MeatStockLog[]) => void) => {
    const q = query(meatStockLogCollectionRef, ...safeOrderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: MeatStockLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                ...data,
                createdAt: toDateSafe(data.createdAt) || new Date()
            } as MeatStockLog);
        });
        callback(logs);
    });
    return unsubscribe;
};


export const listenToMeatStockLogs = (itemId: string, callback: (logs: any[]) => void) => {
    const q = query(
        meatStockLogCollectionRef, 
        where("itemId", "==", itemId), 
        ...safeOrderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: any[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                ...data,
                createdAt: toDateSafe(data.createdAt) || new Date()
            });
        });
        callback(logs);
    });
    return unsubscribe;
};

export const addMeatStockItem = async (item: Omit<MeatStockItem, 'id' | 'createdAt'>, detail?: string): Promise<string> => {
    const docRef = await addDoc(meatStockCollectionRef, {
        ...item,
        isFinished: item.isFinished || false,
        createdAt: serverTimestamp()
    });

    if (item.currentStock > 0 || detail) {
        await addDoc(meatStockLogCollectionRef, {
            itemId: docRef.id,
            change: item.currentStock,
            newStock: item.currentStock,
            type: 'stock-in',
            detail: detail || 'Initial stock',
            createdAt: serverTimestamp()
        });
    }

    return docRef.id;
};

export const addMultipleMeatStockItems = async (items: Omit<MeatStockItem, 'id' | 'createdAt' | 'isFinished'>[], roundDate: Date): Promise<void> => {
    const batch = writeBatch(db);
    const detailText = `ຮອບຂ້າທີ່ ${format(roundDate, 'dd/MM/yyyy')}`;

    items.forEach(item => {
        const itemDocRef = doc(meatStockCollectionRef);
        batch.set(itemDocRef, { ...item, createdAt: Timestamp.fromDate(roundDate) });

        if (item.currentStock > 0) {
            const logDocRef = doc(meatStockLogCollectionRef);
            batch.set(logDocRef, {
                itemId: itemDocRef.id,
                change: item.currentStock,
                newStock: item.currentStock,
                type: 'stock-in',
                detail: detailText,
                createdAt: Timestamp.fromDate(roundDate)
            });
        }
    });

    await batch.commit();
};


export const updateMeatStockItem = async (id: string, updatedFields: Partial<Omit<MeatStockItem, 'id' | 'createdAt'>>) => {
    const itemDoc = doc(db, 'meatStockItems', id);
    const dataToUpdate: any = { ...updatedFields };

    await updateDoc(itemDoc, dataToUpdate);
};

export const deleteMeatStockItem = async (id: string) => {
    const batch = writeBatch(db);
    
    // Delete item
    batch.delete(doc(db, 'meatStockItems', id));

    // Delete logs
    const logsQuery = query(meatStockLogCollectionRef, where("itemId", "==", id));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(logDoc => batch.delete(logDoc.ref));

    await batch.commit();
};

export const updateStockQuantity = async (id: string, change: number, type: 'stock-in' | 'sale', detail: string) => {
    const itemDocRef = doc(db, 'meatStockItems', id);

    await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemDocRef);
        if (!itemDoc.exists()) {
            throw new Error("Item does not exist!");
        }

        const newStock = itemDoc.data().currentStock + change;
        if (newStock < 0) {
            throw new Error("Stock cannot be negative!");
        }

        transaction.update(itemDocRef, { currentStock: newStock });

        const logRef = doc(meatStockLogCollectionRef);
        transaction.set(logRef, {
            itemId: id,
            change: change,
            newStock: newStock,
            type: type,
            detail: detail,
            createdAt: serverTimestamp()
        });
    });
};

export const deleteMeatStockLog = async (logId: string, itemId: string) => {
    await runTransaction(db, async (transaction) => {
        const logDocRef = doc(db, 'meatStockLogs', logId);
        const itemDocRef = doc(db, 'meatStockItems', itemId);
        
        const logDoc = await transaction.get(logDocRef);
        if (!logDoc.exists()) {
            throw new Error("Log entry not found.");
        }

        const itemDoc = await transaction.get(itemDocRef);
        if (!itemDoc.exists()) {
             throw new Error("Stock Item not found.");
        }

        const logToDelete = logDoc.data() as MeatStockLog;
        const changeToReverse = -logToDelete.change; 

        // Update the item's stock
        transaction.update(itemDocRef, { currentStock: increment(changeToReverse) });
        
        // Delete the log
        transaction.delete(logDocRef);
    });
};

export const updateMeatStockLog = async (logId: string, itemId: string, updates: { change: number, detail: string }) => {
    await runTransaction(db, async (transaction) => {
        const logDocRef = doc(db, 'meatStockLogs', logId);
        const itemDocRef = doc(db, 'meatStockItems', itemId);

        const logDoc = await transaction.get(logDocRef);
        if (!logDoc.exists()) {
            throw new Error("Log entry not found.");
        }

        const itemDoc = await transaction.get(itemDocRef);
        if (!itemDoc.exists()) {
            throw new Error("Stock Item not found.");
        }
        
        const originalLog = logDoc.data() as MeatStockLog;
        const oldChange = originalLog.change;
        
        // Ensure sale is negative and stock-in is positive
        const newChange = originalLog.type === 'sale' ? -Math.abs(updates.change) : Math.abs(updates.change);
        
        const difference = newChange - oldChange;

        if (difference !== 0) {
            transaction.update(itemDocRef, { currentStock: increment(difference) });
        }
        
        transaction.update(logDocRef, { 
            change: newChange, 
            detail: updates.detail,
            // newStock is now just informational and doesn't need to be perfectly in sync for calculations
            newStock: increment(difference) 
        });
    });
};


export const getAllMeatStockItemIds = async (): Promise<{ id: string }[]> => {
    const q = query(meatStockCollectionRef);
    const querySnapshot = await getDocs(q);
    const ids = querySnapshot.docs.map(doc => ({ id: doc.id }));
    if (ids.length === 0) {
        return [{ id: 'default' }];
    }
    return ids;
};

export const getMeatStockItem = async (id: string): Promise<MeatStockItem | null> => {
    if (id === 'default') {
        return null;
    }
    const docRef = doc(db, 'meatStockItems', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: toDateSafe(data.createdAt),
        } as MeatStockItem;
    } else {
        return null;
    }
}
