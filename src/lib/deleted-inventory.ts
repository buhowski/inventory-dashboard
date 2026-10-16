import { createdInventoryStorageKey } from '@/lib/local-inventory';

export const deletedReceiptStorageKey = 'inventory.deletedReceipts';
const legacyDeletedReceiptStorageKey = 'inventory.deletedOrders';
export const deletedProductStorageKey = 'inventory.deletedProducts';

type InventoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readDeletedIds(storage: InventoryStorage, key: string): string[] {
	const storedValue =
		storage.getItem(key) ??
		(key === deletedReceiptStorageKey ? storage.getItem(legacyDeletedReceiptStorageKey) : null);
	if (!storedValue) return [];

	try {
		const parsedValue: unknown = JSON.parse(storedValue);
		return Array.isArray(parsedValue)
			? parsedValue
					.filter((id): id is string => typeof id === 'string')
					.map((id) => (key === deletedReceiptStorageKey ? id.replace(/^ORD-/, 'RCT-') : id))
			: [];
	} catch {
		return [];
	}
}

export function persistDeletedId(storage: InventoryStorage, key: string, id: string): void {
	const deletedIds = readDeletedIds(storage, key);
	storage.setItem(key, JSON.stringify([...new Set([...deletedIds, id])]));
	if (key === deletedReceiptStorageKey) storage.removeItem(legacyDeletedReceiptStorageKey);
}

export function clearDeletedInventory(storage: InventoryStorage): void {
	storage.removeItem(deletedReceiptStorageKey);
	storage.removeItem(legacyDeletedReceiptStorageKey);
	storage.removeItem(deletedProductStorageKey);
}

export function clearLocalInventory(storage: InventoryStorage): void {
	clearDeletedInventory(storage);
	storage.removeItem(createdInventoryStorageKey);
}
