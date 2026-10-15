export const deletedOrderStorageKey = 'inventory.deletedOrders';
export const deletedProductStorageKey = 'inventory.deletedProducts';

type InventoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readDeletedIds(storage: InventoryStorage, key: string): string[] {
	const storedValue = storage.getItem(key);
	if (!storedValue) return [];

	try {
		const parsedValue: unknown = JSON.parse(storedValue);
		return Array.isArray(parsedValue)
			? parsedValue.filter((id): id is string => typeof id === 'string')
			: [];
	} catch {
		return [];
	}
}

export function persistDeletedId(storage: InventoryStorage, key: string, id: string): void {
	const deletedIds = readDeletedIds(storage, key);
	storage.setItem(key, JSON.stringify([...new Set([...deletedIds, id])]));
}

export function clearDeletedInventory(storage: InventoryStorage): void {
	storage.removeItem(deletedOrderStorageKey);
	storage.removeItem(deletedProductStorageKey);
}
