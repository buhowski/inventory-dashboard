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
	receiptId: string;
}

export interface Receipt {
	id: string;
	title: string;
	receivedAt: string;
	description: string;
	productIds: string[];
}

export type ReceiptTotals = Partial<Record<Currency, number>>;
