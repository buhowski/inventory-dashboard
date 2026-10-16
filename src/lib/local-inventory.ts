import type { Receipt, Product } from '@/lib/types';

export const createdInventoryStorageKey = 'inventory.createdRecords';

export interface CreatedInventory {
	receipts: Receipt[];
	products: Product[];
}

type InventoryStorage = Pick<Storage, 'getItem' | 'setItem'>;

const emptyInventory: CreatedInventory = { receipts: [], products: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function normalizeReceipt(value: unknown): Receipt | null {
	if (!isRecord(value)) return null;
	const receivedAt =
		typeof value.receivedAt === 'string' ? value.receivedAt : value.date;
	const id =
		typeof value.id === 'string' ? value.id.replace(/^ORD-/, 'RCT-') : value.id;
	const isValidReceipt =
		typeof id === 'string' &&
		typeof value.title === 'string' &&
		typeof receivedAt === 'string' &&
		typeof value.description === 'string' &&
		Array.isArray(value.productIds) &&
		value.productIds.every((id) => typeof id === 'string');
	if (!isValidReceipt) return null;
	const normalizedValue = { ...value, id, receivedAt };
	delete normalizedValue.date;
	return normalizedValue as unknown as Receipt;
}

function normalizeProduct(value: unknown): Product | null {
	if (!isRecord(value)) return null;
	const receiptId =
		typeof value.receiptId === 'string' ? value.receiptId : value.orderId;
	if (typeof receiptId !== 'string') return null;
	const normalizedValue = {
		...value,
		receiptId: receiptId.replace(/^ORD-/, 'RCT-'),
	};
	delete normalizedValue.orderId;
	const isValidProduct =
		typeof value.id === 'string' &&
		typeof receiptId === 'string' &&
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
		);
	return isValidProduct ? (normalizedValue as Product) : null;
}

export function readCreatedInventory(
	storage: Pick<Storage, 'getItem'>,
): CreatedInventory {
	const storedValue = storage.getItem(createdInventoryStorageKey);
	if (!storedValue) return emptyInventory;

	try {
		const parsedValue: unknown = JSON.parse(storedValue);
		if (!isRecord(parsedValue)) return emptyInventory;
		const rawReceipts = Array.isArray(parsedValue.receipts)
			? parsedValue.receipts
			: Array.isArray(parsedValue.orders)
				? parsedValue.orders
				: [];
		const receipts = rawReceipts.flatMap((receipt) => {
			const normalizedReceipt = normalizeReceipt(receipt);
			return normalizedReceipt ? [normalizedReceipt] : [];
		});
		const products = Array.isArray(parsedValue.products)
			? parsedValue.products.flatMap((product) => {
					const normalizedProduct = normalizeProduct(product);
					return normalizedProduct ? [normalizedProduct] : [];
				})
			: [];
		return { receipts, products };
	} catch {
		return emptyInventory;
	}
}

export function persistCreatedInventory(
	storage: InventoryStorage,
	receipt: Receipt,
	products: Product[],
): void {
	const createdInventory = readCreatedInventory(storage);
	storage.setItem(
		createdInventoryStorageKey,
		JSON.stringify({
			receipts: [...createdInventory.receipts, receipt],
			products: [...createdInventory.products, ...products],
		}),
	);
}
