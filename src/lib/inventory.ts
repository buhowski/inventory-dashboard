import type { Order, OrderTotals, Product } from '@/lib/types';

export function getOrderTotals(products: Product[]): OrderTotals {
	return products.reduce<OrderTotals>((totals, product) => {
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

export function getOrderProducts(order: Order, products: Product[]): Product[] {
	return order.productIds
		.map((productId) => products.find((product) => product.id === productId))
		.filter((product): product is Product => product !== undefined);
}

export function getOrderSearchText(order: Order): string {
	return `${order.title} ${order.id} ${order.description}`;
}

export function getProductSearchText(product: Product, order?: Order): string {
	return `${product.title} ${product.type} ${product.serialNumber} ${product.specification} ${order?.title ?? ''}`;
}
