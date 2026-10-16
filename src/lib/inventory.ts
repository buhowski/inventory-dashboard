import type { Receipt, ReceiptTotals, Product } from '@/lib/types';

export function getReceiptTotals(products: Product[]): ReceiptTotals {
	return products.reduce<ReceiptTotals>((totals, product) => {
		product.prices.forEach(({ currency, value }) => {
			totals[currency] = (totals[currency] ?? 0) + value;
		});
		return totals;
	}, {});
}

export function formatDate(value: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value));
}

export function formatCompactDate(value: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: '2-digit',
	}).format(new Date(value));
}

export function formatPrice(value: number, currency: string): string {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency,
		currencyDisplay: currency === 'USD' ? 'narrowSymbol' : 'code',
		maximumFractionDigits: 2,
	}).format(value);
}

export function matchesSearch(value: string, query: string): boolean {
	return value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

export function getReceiptProducts(
	receipt: Receipt,
	products: Product[],
): Product[] {
	return receipt.productIds
		.map((productId) => products.find((product) => product.id === productId))
		.filter((product): product is Product => product !== undefined);
}

export function getReceiptSearchText(receipt: Receipt): string {
	return `${receipt.title} ${receipt.id} ${receipt.description}`;
}

export function getProductSearchText(
	product: Product,
	receipt?: Receipt,
): string {
	return `${product.title} ${product.type} ${product.serialNumber} ${product.specification} ${receipt?.title ?? ''}`;
}
