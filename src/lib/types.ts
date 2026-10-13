export type Currency = 'USD' | 'UAH';

export interface Price {
	currency: Currency;
	value: number;
}

export interface Guarantee {
	start: string;
	end: string;
}

export interface Product {
	id: string;
	serialNumber: string;
	title: string;
	type: string;
	specification: string;
	isNew: boolean;
	status: 'Available' | 'In repair';
	guarantee: Guarantee;
	prices: Price[];
	orderId: string;
}

export interface Order {
	id: string;
	title: string;
	date: string;
	description: string;
	productIds: string[];
}

export type OrderTotals = Partial<Record<Currency, number>>;
