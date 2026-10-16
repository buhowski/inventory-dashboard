'use client';

import {
	configureStore,
	createAsyncThunk,
	createSlice,
	type PayloadAction,
} from '@reduxjs/toolkit';
import type { Receipt, Product } from '@/lib/types';
import { readCreatedInventory } from '@/lib/local-inventory';

interface InventoryState {
	receipts: Receipt[];
	products: Product[];
	deletedReceiptIds: string[];
	deletedProductIds: string[];
	searchQuery: string;
	selectedReceiptId: string | null;
	status: 'idle' | 'loading' | 'ready' | 'failed';
	error: string | null;
}

const initialState: InventoryState = {
	receipts: [],
	products: [],
	deletedReceiptIds: [],
	deletedProductIds: [],
	searchQuery: '',
	selectedReceiptId: null,
	status: 'idle',
	error: null,
};

export const loadInventory = createAsyncThunk(
	'inventory/load',
	async (_, { rejectWithValue }) => {
		const [receiptsResponse, productsResponse] = await Promise.all([
			fetch('/api/receipts', { cache: 'no-store' }),
			fetch('/api/products', { cache: 'no-store' }),
		]);

		if (!receiptsResponse.ok || !productsResponse.ok) {
			return rejectWithValue(
				'Inventory could not be loaded. Please try again.',
			);
		}

		const [receipts, products] = await Promise.all([
			receiptsResponse.json() as Promise<Receipt[]>,
			productsResponse.json() as Promise<Product[]>,
		]);
		let createdInventory = {
			receipts: [] as Receipt[],
			products: [] as Product[],
		};
		if (typeof window !== 'undefined') {
			try {
				createdInventory = readCreatedInventory(window.localStorage);
			} catch {
				// Keep the server-provided demo inventory available if browser storage is blocked.
			}
		}

		return {
			receipts: [...receipts, ...createdInventory.receipts],
			products: [...products, ...createdInventory.products],
		};
	},
);

const inventorySlice = createSlice({
	name: 'inventory',
	initialState,
	reducers: {
		setSearchQuery(state, action: PayloadAction<string>) {
			state.searchQuery = action.payload;
		},
		selectReceipt(state, action: PayloadAction<string | null>) {
			state.selectedReceiptId = action.payload;
		},
		addReceiptWithProducts(
			state,
			action: PayloadAction<{ receipt: Receipt; products: Product[] }>,
		) {
			state.receipts.unshift(action.payload.receipt);
			state.products.unshift(...action.payload.products);
		},
		setDeletedReceiptIds(state, action: PayloadAction<string[]>) {
			state.deletedReceiptIds = action.payload;
			state.receipts = state.receipts.filter(
				(receipt) => !action.payload.includes(receipt.id),
			);
			state.products = state.products.filter(
				(product) => !action.payload.includes(product.receiptId),
			);
		},
		setDeletedProductIds(state, action: PayloadAction<string[]>) {
			state.deletedProductIds = [...new Set(action.payload)];
			state.products = state.products.filter(
				(product) => !state.deletedProductIds.includes(product.id),
			);
			state.receipts = state.receipts.map((receipt) => ({
				...receipt,
				productIds: receipt.productIds.filter(
					(productId) => !state.deletedProductIds.includes(productId),
				),
			}));
		},
		deleteReceipt(state, action: PayloadAction<string>) {
			state.deletedReceiptIds = [
				...new Set([...state.deletedReceiptIds, action.payload]),
			];
			state.receipts = state.receipts.filter(
				(receipt) => receipt.id !== action.payload,
			);
			state.products = state.products.filter(
				(product) => product.receiptId !== action.payload,
			);
			if (state.selectedReceiptId === action.payload)
				state.selectedReceiptId = null;
		},
		deleteProduct(state, action: PayloadAction<string>) {
			state.deletedProductIds = [
				...new Set([...state.deletedProductIds, action.payload]),
			];
			state.products = state.products.filter(
				(product) => product.id !== action.payload,
			);
			state.receipts = state.receipts.map((receipt) => ({
				...receipt,
				productIds: receipt.productIds.filter(
					(productId) => productId !== action.payload,
				),
			}));
		},
		resetDeletedInventory(state) {
			state.deletedProductIds = [];
			state.deletedReceiptIds = [];
			state.selectedReceiptId = null;
		},
	},
	extraReducers(builder) {
		builder
			.addCase(loadInventory.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			// Reapply local deletions and sync each receipt's product IDs
			.addCase(loadInventory.fulfilled, (state, action) => {
				state.receipts = action.payload.receipts.filter(
					(receipt) => !state.deletedReceiptIds.includes(receipt.id),
				);
				state.products = action.payload.products.filter(
					(product) =>
						!state.deletedReceiptIds.includes(product.receiptId) &&
						!state.deletedProductIds.includes(product.id),
				);
				const productIds = new Set(state.products.map((product) => product.id));
				state.receipts = state.receipts.map((receipt) => ({
					...receipt,
					productIds: receipt.productIds.filter((productId) =>
						productIds.has(productId),
					),
				}));
				state.status = 'ready';
			})
			.addCase(loadInventory.rejected, (state, action) => {
				state.status = 'failed';
				state.error =
					typeof action.payload === 'string'
						? action.payload
						: 'Inventory could not be loaded. Please try again.';
			});
	},
});

export const {
	deleteReceipt,
	deleteProduct,
	addReceiptWithProducts,
	resetDeletedInventory,
	selectReceipt,
	setDeletedReceiptIds,
	setDeletedProductIds,
	setSearchQuery,
} = inventorySlice.actions;

export const makeStore = () =>
	configureStore({
		reducer: { inventory: inventorySlice.reducer },
	});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
