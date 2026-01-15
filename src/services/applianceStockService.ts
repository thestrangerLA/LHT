
import { db } from '@/lib/firebase';
import type { ApplianceStockItem, ApplianceStockLog } from '@/lib/types';
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
import { safeOrderBy } from '@/lib/firestoreHelpers';
import { toDateSafe } from '@/lib/timestamp';

const stockCollectionRef = collection(db, 'applianceStockItems');
const logCollectionRef = collection(db, 'applianceStockLogs');

export const listenToApplianceStockItems = (callback: (items: ApplianceStockItem[]) => void) => {
    const q = query(stockCollectionRef, ...safeOrderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: ApplianceStockItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({ 
                id: doc.id, 
                ...data,
                createdAt: toDateSafe(data.createdAt)
            } as ApplianceStockItem);
        });
        callback(items);
    });
    return unsubscribe;
};

export const addApplianceStockItem = async (item: Omit<ApplianceStockItem, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(stockCollectionRef, {
        ...item,
        createdAt: serverTimestamp()
    });

    if (item.currentStock > 0) {
        await addDoc(logCollectionRef, {
            itemId: docRef.id,
            change: item.currentStock,
            newStock: item.currentStock,
            type: 'stock-in',
            detail: 'Initial stock',
            createdAt: serverTimestamp()
        });
    }

    return docRef.id;
};

export const updateApplianceStockItem = async (id: string, updatedFields: Partial<Omit<ApplianceStockItem, 'id' | 'createdAt'>>) => {
    const itemDoc = doc(db, 'applianceStockItems', id);
    await updateDoc(itemDoc, updatedFields);
};

export const deleteApplianceStockItem = async (id: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'applianceStockItems', id));

    const logsQuery = query(logCollectionRef, where("itemId", "==", id));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(logDoc => batch.delete(logDoc.ref));

    await batch.commit();
};

export const updateApplianceStockQuantity = async (id: string, change: number, type: 'stock-in' | 'sale', detail: string) => {
    const itemDocRef = doc(db, 'applianceStockItems', id);

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

        const logRef = doc(logCollectionRef);
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

export const listenToApplianceStockLogs = (itemId: string, callback: (logs: ApplianceStockLog[]) => void) => {
    const q = query(
        logCollectionRef, 
        where("itemId", "==", itemId), 
        ...safeOrderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const logs: ApplianceStockLog[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                ...data,
                createdAt: toDateSafe(data.createdAt) || new Date()
            } as ApplianceStockLog);
        });
        callback(logs);
    });
    return unsubscribe;
};

export const deleteApplianceStockLog = async (logId: string, itemId: string) => {
    await runTransaction(db, async (transaction) => {
        const logDocRef = doc(logCollectionRef, logId);
        const itemDocRef = doc(stockCollectionRef, itemId);
        
        const logDoc = await transaction.get(logDocRef);
        if (!logDoc.exists()) throw new Error("Log entry not found.");

        const itemDoc = await transaction.get(itemDocRef);
        if (!itemDoc.exists()) throw new Error("Stock Item not found.");

        const logToDelete = logDoc.data() as ApplianceStockLog;
        const changeToReverse = -logToDelete.change; 

        transaction.update(itemDocRef, { currentStock: increment(changeToReverse) });
        transaction.delete(logDocRef);
    });
};

export const updateApplianceStockLog = async (logId: string, itemId: string, updates: { change: number, detail: string }) => {
    await runTransaction(db, async (transaction) => {
        const logDocRef = doc(logCollectionRef, logId);
        const itemDocRef = doc(stockCollectionRef, itemId);

        const logDoc = await transaction.get(logDocRef);
        if (!logDoc.exists()) throw new Error("Log entry not found.");
        
        const itemDoc = await transaction.get(itemDocRef);
        if (!itemDoc.exists()) throw new Error("Stock Item not found.");
        
        const originalLog = logDoc.data() as ApplianceStockLog;
        const oldChange = originalLog.change;
        
        const newChange = originalLog.type === 'sale' ? -Math.abs(updates.change) : Math.abs(updates.change);
        
        const difference = newChange - oldChange;

        if (difference !== 0) {
            transaction.update(itemDocRef, { currentStock: increment(difference) });
        }
        
        transaction.update(logDocRef, { 
            change: newChange, 
            detail: updates.detail,
            newStock: increment(difference) 
        });
    });
};

export const getAllApplianceStockItemIds = async (): Promise<{ id: string }[]> => {
    const q = query(stockCollectionRef);
    const querySnapshot = await getDocs(q);
    const ids = querySnapshot.docs.map(doc => ({ id: doc.id }));
    if (ids.length === 0) {
        return [{ id: 'default' }];
    }
    return ids;
};

export const getApplianceStockItem = async (id: string): Promise<ApplianceStockItem | null> => {
    if (id === 'default') {
        return null;
    }
    const docRef = doc(db, 'applianceStockItems', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: toDateSafe(data.createdAt),
        } as ApplianceStockItem;
    } else {
        return null;
    }
}
