import { describe, expect, it } from 'vitest';
import {
	getReceiptProducts,
	getReceiptTotals,
	matchesSearch,
} from '@/lib/inventory';
import {
	deleteReceipt,
	deleteProduct,
	loadInventory,
	makeStore,
	resetDeletedInventory,
	setDeletedReceiptIds,
	setDeletedProductIds,
} from '@/lib/store';
import type { Receipt, Product } from '@/lib/types';

const receipt: Receipt = {
	id: 'RCT-1',
	title: 'Office delivery',
	receivedAt: '2025-04-06T00:00:00.000Z',
	description: 'Equipment delivery',
	productIds: ['PRD-1', 'PRD-2'],
};

const sampleProducts: Product[] = [
	{
		id: 'PRD-1',
		serialNumber: 'SN-1',
		title: 'Display',
		type: 'Monitors',
		specification: '4K',
		isNew: true,
		status: 'Available',
		guarantee: {
			start: '2025-04-06T00:00:00.000Z',
			end: '2028-04-06T00:00:00.000Z',
		},
		prices: [
			{ value: 100, currency: 'USD' },
			{ value: 4000, currency: 'UAH' },
		],
		receiptId: 'RCT-1',
	},
	{
		id: 'PRD-2',
		serialNumber: 'SN-2',
		title: 'Keyboard',
		type: 'Keyboards',
		specification: 'Wireless',
		isNew: false,
		status: 'Available',
		guarantee: {
			start: '2025-04-06T00:00:00.000Z',
			end: '2027-04-06T00:00:00.000Z',
		},
		prices: [
			{ value: 50, currency: 'USD' },
			{ value: 2000, currency: 'UAH' },
		],
		receiptId: 'RCT-1',
	},
];

describe('inventory helpers', () => {
	it('sums receipt values independently by currency', () => {
		expect(getReceiptTotals(sampleProducts)).toEqual({ USD: 150, UAH: 6000 });
	});

	it('resolves only the products listed on a receipt', () => {
		expect(
			getReceiptProducts(receipt, sampleProducts).map(({ id }) => id),
		).toEqual(['PRD-1', 'PRD-2']);
		expect(
			getReceiptProducts(
				{ ...receipt, productIds: ['missing'] },
				sampleProducts,
			),
		).toEqual([]);
	});

	it('searches case-insensitively and ignores surrounding spaces', () => {
		expect(matchesSearch('StudioView Monitor', '  studioview ')).toBe(true);
		expect(matchesSearch('StudioView Monitor', 'keyboard')).toBe(false);
	});
});

describe('inventory state', () => {
	it('removes receipt products when a receipt is deleted', () => {
		const store = makeStore();
		store.dispatch(
			loadInventory.fulfilled(
				{ receipts: [receipt], products: sampleProducts },
				'request',
				undefined,
			),
		);

		store.dispatch(deleteReceipt(receipt.id));

		expect(store.getState().inventory.receipts).toEqual([]);
		expect(store.getState().inventory.products).toEqual([]);
	});

	it('keeps restored deletions hidden after inventory loads', () => {
		const store = makeStore();
		store.dispatch(setDeletedReceiptIds([receipt.id]));
		store.dispatch(
			loadInventory.fulfilled(
				{ receipts: [receipt], products: sampleProducts },
				'request',
				undefined,
			),
		);

		expect(store.getState().inventory.receipts).toEqual([]);
		expect(store.getState().inventory.products).toEqual([]);
	});

	it('removes a deleted product from its receipt and recalculates its product list', () => {
		const store = makeStore();
		store.dispatch(
			loadInventory.fulfilled(
				{ receipts: [receipt], products: sampleProducts },
				'request',
				undefined,
			),
		);

		store.dispatch(deleteProduct('PRD-1'));

		expect(store.getState().inventory.products.map(({ id }) => id)).toEqual([
			'PRD-2',
		]);
		expect(store.getState().inventory.receipts[0].productIds).toEqual([
			'PRD-2',
		]);
		expect(
			getReceiptProducts(
				store.getState().inventory.receipts[0],
				store.getState().inventory.products,
			),
		).toHaveLength(1);
	});

	it('keeps deleted products hidden after inventory reload', () => {
		const store = makeStore();
		store.dispatch(setDeletedProductIds(['PRD-1']));
		store.dispatch(
			loadInventory.fulfilled(
				{ receipts: [receipt], products: sampleProducts },
				'request',
				undefined,
			),
		);

		expect(store.getState().inventory.products.map(({ id }) => id)).toEqual([
			'PRD-2',
		]);
		expect(store.getState().inventory.receipts[0].productIds).toEqual([
			'PRD-2',
		]);
	});

	it('restores deleted receipts and products when demo inventory is reset and reloaded', () => {
		const store = makeStore();
		store.dispatch(setDeletedProductIds(['PRD-1', 'PRD-2']));
		store.dispatch(setDeletedReceiptIds([receipt.id]));
		store.dispatch(resetDeletedInventory());
		store.dispatch(
			loadInventory.fulfilled(
				{ receipts: [receipt], products: sampleProducts },
				'request',
				undefined,
			),
		);

		expect(store.getState().inventory.products.map(({ id }) => id)).toEqual([
			'PRD-1',
			'PRD-2',
		]);
		expect(store.getState().inventory.receipts[0].productIds).toEqual([
			'PRD-1',
			'PRD-2',
		]);
		expect(store.getState().inventory.deletedReceiptIds).toEqual([]);
	});
});
