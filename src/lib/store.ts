'use client';

import {
	configureStore,
	createAsyncThunk,
	createSlice,
	type PayloadAction,
} from '@reduxjs/toolkit';
import type { Order, Product } from '@/lib/types';
import { readCreatedInventory } from '@/lib/local-inventory';

interface InventoryState {
	orders: Order[];
	products: Product[];
	deletedOrderIds: string[];
	deletedProductIds: string[];
	searchQuery: string;
	selectedOrderId: string | null;
	status: 'idle' | 'loading' | 'ready' | 'failed';
	error: string | null;
}

const initialState: InventoryState = {
	orders: [],
	products: [],
	deletedOrderIds: [],
	deletedProductIds: [],
	searchQuery: '',
	selectedOrderId: null,
	status: 'idle',
	error: null,
};

export const loadInventory = createAsyncThunk('inventory/load', async (_, { rejectWithValue }) => {
	const [ordersResponse, productsResponse] = await Promise.all([
		fetch('/api/orders', { cache: 'no-store' }),
		fetch('/api/products', { cache: 'no-store' }),
	]);

	if (!ordersResponse.ok || !productsResponse.ok) {
		return rejectWithValue('Inventory could not be loaded. Please try again.');
	}

	const [orders, products] = await Promise.all([
		ordersResponse.json() as Promise<Order[]>,
		productsResponse.json() as Promise<Product[]>,
	]);
	let createdInventory = { orders: [] as Order[], products: [] as Product[] };
	if (typeof window !== 'undefined') {
		try {
			createdInventory = readCreatedInventory(window.localStorage);
		} catch {
			// Keep the server-provided demo inventory available if browser storage is blocked.
		}
	}

	return {
		orders: [...orders, ...createdInventory.orders],
		products: [...products, ...createdInventory.products],
	};
});

const inventorySlice = createSlice({
	name: 'inventory',
	initialState,
	reducers: {
		setSearchQuery(state, action: PayloadAction<string>) {
			state.searchQuery = action.payload;
		},
		selectOrder(state, action: PayloadAction<string | null>) {
			state.selectedOrderId = action.payload;
		},
		addOrderWithProducts(state, action: PayloadAction<{ order: Order; products: Product[] }>) {
			state.orders.unshift(action.payload.order);
			state.products.unshift(...action.payload.products);
		},
		setDeletedOrderIds(state, action: PayloadAction<string[]>) {
			state.deletedOrderIds = action.payload;
			state.orders = state.orders.filter((order) => !action.payload.includes(order.id));
			state.products = state.products.filter(
				(product) => !action.payload.includes(product.orderId),
			);
		},
		setDeletedProductIds(state, action: PayloadAction<string[]>) {
			state.deletedProductIds = [...new Set(action.payload)];
			state.products = state.products.filter(
				(product) => !state.deletedProductIds.includes(product.id),
			);
			state.orders = state.orders.map((order) => ({
				...order,
				productIds: order.productIds.filter(
					(productId) => !state.deletedProductIds.includes(productId),
				),
			}));
		},
		deleteOrder(state, action: PayloadAction<string>) {
			state.deletedOrderIds = [...new Set([...state.deletedOrderIds, action.payload])];
			state.orders = state.orders.filter((order) => order.id !== action.payload);
			state.products = state.products.filter((product) => product.orderId !== action.payload);
			if (state.selectedOrderId === action.payload) state.selectedOrderId = null;
		},
		deleteProduct(state, action: PayloadAction<string>) {
			state.deletedProductIds = [...new Set([...state.deletedProductIds, action.payload])];
			state.products = state.products.filter((product) => product.id !== action.payload);
			state.orders = state.orders.map((order) => ({
				...order,
				productIds: order.productIds.filter((productId) => productId !== action.payload),
			}));
		},
		resetDeletedInventory(state) {
			state.deletedProductIds = [];
			state.deletedOrderIds = [];
			state.selectedOrderId = null;
		},
	},
	extraReducers(builder) {
		builder
			.addCase(loadInventory.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			// Reapply local deletions and sync each order's product IDs
			.addCase(loadInventory.fulfilled, (state, action) => {
				state.orders = action.payload.orders.filter(
					(order) => !state.deletedOrderIds.includes(order.id),
				);
				state.products = action.payload.products.filter(
					(product) =>
						!state.deletedOrderIds.includes(product.orderId) &&
						!state.deletedProductIds.includes(product.id),
				);
				const productIds = new Set(state.products.map((product) => product.id));
				state.orders = state.orders.map((order) => ({
					...order,
					productIds: order.productIds.filter((productId) => productIds.has(productId)),
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
	deleteOrder,
	deleteProduct,
	addOrderWithProducts,
	resetDeletedInventory,
	selectOrder,
	setDeletedOrderIds,
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
