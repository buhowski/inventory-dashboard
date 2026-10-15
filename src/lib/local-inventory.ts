import type { Order, Product } from '@/lib/types';

export const createdInventoryStorageKey = 'inventory.createdRecords';

export interface CreatedInventory {
	orders: Order[];
	products: Product[];
}

type InventoryStorage = Pick<Storage, 'getItem' | 'setItem'>;

const emptyInventory: CreatedInventory = { orders: [], products: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isOrder(value: unknown): value is Order {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.title === 'string' &&
		typeof value.date === 'string' &&
		typeof value.description === 'string' &&
		Array.isArray(value.productIds) &&
		value.productIds.every((id) => typeof id === 'string')
	);
}

function isProduct(value: unknown): value is Product {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.orderId === 'string' &&
		typeof value.serialNumber === 'string' &&
		typeof value.title === 'string' &&
		typeof value.type === 'string' &&
		typeof value.specification === 'string' &&
		typeof value.isNew === 'boolean' &&
		(value.status === 'Available' || value.status === 'In repair') &&
		isRecord(value.guarantee) &&
		typeof value.guarantee.start === 'string' &&
		typeof value.guarantee.end === 'string' &&
		Array.isArray(value.prices) &&
		value.prices.every(
			(price) =>
				isRecord(price) &&
				(price.currency === 'USD' || price.currency === 'UAH') &&
				typeof price.value === 'number' &&
				Number.isFinite(price.value),
		)
	);
}

export function readCreatedInventory(storage: Pick<Storage, 'getItem'>): CreatedInventory {
	const storedValue = storage.getItem(createdInventoryStorageKey);
	if (!storedValue) return emptyInventory;

	try {
		const parsedValue: unknown = JSON.parse(storedValue);
		if (!isRecord(parsedValue)) return emptyInventory;
		const orders = Array.isArray(parsedValue.orders) ? parsedValue.orders.filter(isOrder) : [];
		const products = Array.isArray(parsedValue.products)
			? parsedValue.products.filter(isProduct)
			: [];
		return { orders, products };
	} catch {
		return emptyInventory;
	}
}

export function persistCreatedInventory(
	storage: InventoryStorage,
	order: Order,
	products: Product[],
): void {
	const createdInventory = readCreatedInventory(storage);
	storage.setItem(
		createdInventoryStorageKey,
		JSON.stringify({
			orders: [...createdInventory.orders, order],
			products: [...createdInventory.products, ...products],
		}),
	);
}
