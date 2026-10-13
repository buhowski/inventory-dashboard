import type { Order, OrderTotals, Product } from '@/lib/types';

// Add product totals by currency.
export function getOrderTotals(products: Product[]): OrderTotals {
	return products.reduce<OrderTotals>((totals, product) => {
		product.prices.forEach(({ currency, value }) => {
			totals[currency] = (totals[currency] ?? 0) + value;
		});
		return totals;
	}, {});
}

// Format dates for dashboard labels.
export function formatDate(value: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value));
}

// Format dates for compact metadata.
export function formatCompactDate(value: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: '2-digit',
	}).format(new Date(value));
}

// Display a price using its currency.
export function formatPrice(value: number, currency: string): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	}).format(value);
}

// Search inventory across visible fields.
export function matchesSearch(value: string, query: string): boolean {
	return value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

// Resolve products belonging to an order.
export function getOrderProducts(order: Order, products: Product[]): Product[] {
	return order.productIds
		.map((productId) => products.find((product) => product.id === productId))
		.filter((product): product is Product => product !== undefined);
}

// Build searchable order text.
export function getOrderSearchText(order: Order): string {
	return `${order.title} ${order.id} ${order.description}`;
}

// Build searchable product text.
export function getProductSearchText(product: Product, order?: Order): string {
	return `${product.title} ${product.type} ${product.serialNumber} ${product.specification} ${order?.title ?? ''}`;
}
