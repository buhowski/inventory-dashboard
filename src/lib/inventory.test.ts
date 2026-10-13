import { describe, expect, it } from 'vitest';
import { getOrderProducts, getOrderTotals, matchesSearch } from '@/lib/inventory';
import { deleteOrder, loadInventory, makeStore, setDeletedOrderIds } from '@/lib/store';
import type { Order, Product } from '@/lib/types';

const order: Order = {
	id: 'ORD-1',
	title: 'Office delivery',
	date: '2025-04-06T00:00:00.000Z',
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
		guarantee: { start: '2025-04-06T00:00:00.000Z', end: '2028-04-06T00:00:00.000Z' },
		prices: [
			{ value: 100, currency: 'USD' },
			{ value: 4000, currency: 'UAH' },
		],
		orderId: 'ORD-1',
	},
	{
		id: 'PRD-2',
		serialNumber: 'SN-2',
		title: 'Keyboard',
		type: 'Keyboards',
		specification: 'Wireless',
		isNew: false,
		status: 'Available',
		guarantee: { start: '2025-04-06T00:00:00.000Z', end: '2027-04-06T00:00:00.000Z' },
		prices: [
			{ value: 50, currency: 'USD' },
			{ value: 2000, currency: 'UAH' },
		],
		orderId: 'ORD-1',
	},
];

// Verify receipt totals and relationships.
describe('inventory helpers', () => {
	it('sums receipt values independently by currency', () => {
		expect(getOrderTotals(sampleProducts)).toEqual({ USD: 150, UAH: 6000 });
	});

	it('resolves only the products listed on a receipt', () => {
		expect(getOrderProducts(order, sampleProducts).map(({ id }) => id)).toEqual(['PRD-1', 'PRD-2']);
		expect(getOrderProducts({ ...order, productIds: ['missing'] }, sampleProducts)).toEqual([]);
	});

	it('searches case-insensitively and ignores surrounding spaces', () => {
		expect(matchesSearch('StudioView Monitor', '  studioview ')).toBe(true);
		expect(matchesSearch('StudioView Monitor', 'keyboard')).toBe(false);
	});
});

// Keep receipt deletion consistent.
describe('inventory state', () => {
	it('removes receipt products when an order is deleted', () => {
		const store = makeStore();
		store.dispatch(
			loadInventory.fulfilled({ orders: [order], products: sampleProducts }, 'request', undefined),
		);

		store.dispatch(deleteOrder(order.id));

		expect(store.getState().inventory.orders).toEqual([]);
		expect(store.getState().inventory.products).toEqual([]);
	});

	it('keeps restored deletions hidden after inventory loads', () => {
		const store = makeStore();
		store.dispatch(setDeletedOrderIds([order.id]));
		store.dispatch(
			loadInventory.fulfilled({ orders: [order], products: sampleProducts }, 'request', undefined),
		);

		expect(store.getState().inventory.orders).toEqual([]);
		expect(store.getState().inventory.products).toEqual([]);
	});
});
