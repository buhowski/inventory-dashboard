import { describe, expect, it } from 'vitest';
import {
	clearDeletedInventory,
	deletedOrderStorageKey,
	deletedProductStorageKey,
	persistDeletedId,
	readDeletedIds,
} from './deleted-inventory';

function createStorage(initialValues: Record<string, string> = {}) {
	const values = new Map(Object.entries(initialValues));
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value),
		removeItem: (key: string) => values.delete(key),
	};
}

describe('deleted inventory storage', () => {
	it('reads only string IDs and tolerates invalid stored data', () => {
		const storage = createStorage({
			[deletedOrderStorageKey]: '["order-1", 2, null, "order-2"]',
			[deletedProductStorageKey]: '{invalid json',
		});

		expect(readDeletedIds(storage, deletedOrderStorageKey)).toEqual(['order-1', 'order-2']);
		expect(readDeletedIds(storage, deletedProductStorageKey)).toEqual([]);
	});

	it('persists each deleted ID once', () => {
		const storage = createStorage({ [deletedProductStorageKey]: '["product-1"]' });

		persistDeletedId(storage, deletedProductStorageKey, 'product-1');
		persistDeletedId(storage, deletedProductStorageKey, 'product-2');

		expect(readDeletedIds(storage, deletedProductStorageKey)).toEqual(['product-1', 'product-2']);
	});

	it('clears deleted IDs for orders and products', () => {
		const storage = createStorage({
			[deletedOrderStorageKey]: '["order-1"]',
			[deletedProductStorageKey]: '["product-1"]',
		});

		clearDeletedInventory(storage);

		expect(readDeletedIds(storage, deletedOrderStorageKey)).toEqual([]);
		expect(readDeletedIds(storage, deletedProductStorageKey)).toEqual([]);
	});
});
