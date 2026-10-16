import { describe, expect, it } from 'vitest';
import {
	clearDeletedInventory,
	deletedReceiptStorageKey,
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
			[deletedReceiptStorageKey]: '["receipt-1", 2, null, "receipt-2"]',
			[deletedProductStorageKey]: '{invalid json',
		});

		expect(readDeletedIds(storage, deletedReceiptStorageKey)).toEqual([
			'receipt-1',
			'receipt-2',
		]);
		expect(readDeletedIds(storage, deletedProductStorageKey)).toEqual([]);
	});

	it('persists each deleted ID once', () => {
		const storage = createStorage({
			[deletedProductStorageKey]: '["product-1"]',
		});

		persistDeletedId(storage, deletedProductStorageKey, 'product-1');
		persistDeletedId(storage, deletedProductStorageKey, 'product-2');

		expect(readDeletedIds(storage, deletedProductStorageKey)).toEqual([
			'product-1',
			'product-2',
		]);
	});

	it('clears deleted IDs for receipts and products', () => {
		const storage = createStorage({
			[deletedReceiptStorageKey]: '["receipt-1"]',
			[deletedProductStorageKey]: '["product-1"]',
		});

		clearDeletedInventory(storage);

		expect(readDeletedIds(storage, deletedReceiptStorageKey)).toEqual([]);
		expect(readDeletedIds(storage, deletedProductStorageKey)).toEqual([]);
	});
});
