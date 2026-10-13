'use client';

import {
	configureStore,
	createAsyncThunk,
	createSlice,
	type PayloadAction,
} from '@reduxjs/toolkit';
import type { Order, Product } from '@/lib/types';

interface InventoryState {
	orders: Order[];
	products: Product[];
	deletedOrderIds: string[];
	searchQuery: string;
	selectedOrderId: string | null;
	status: 'idle' | 'loading' | 'ready' | 'failed';
	error: string | null;
}

const initialState: InventoryState = {
	orders: [],
	products: [],
	deletedOrderIds: [],
	searchQuery: '',
	selectedOrderId: null,
	status: 'idle',
	error: null,
};

// Fetch both dashboard datasets.
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

	return { orders, products };
});

// Keep shared dashboard state.
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
		setDeletedOrderIds(state, action: PayloadAction<string[]>) {
			state.deletedOrderIds = action.payload;
			state.orders = state.orders.filter((order) => !action.payload.includes(order.id));
			state.products = state.products.filter(
				(product) => !action.payload.includes(product.orderId),
			);
		},
		deleteOrder(state, action: PayloadAction<string>) {
			state.deletedOrderIds = [...new Set([...state.deletedOrderIds, action.payload])];
			state.orders = state.orders.filter((order) => order.id !== action.payload);
			state.products = state.products.filter((product) => product.orderId !== action.payload);
			if (state.selectedOrderId === action.payload) state.selectedOrderId = null;
		},
	},
	extraReducers(builder) {
		builder
			.addCase(loadInventory.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(loadInventory.fulfilled, (state, action) => {
				state.orders = action.payload.orders.filter(
					(order) => !state.deletedOrderIds.includes(order.id),
				);
				state.products = action.payload.products.filter(
					(product) => !state.deletedOrderIds.includes(product.orderId),
				);
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

// Export typed Redux helpers.
export const { deleteOrder, selectOrder, setDeletedOrderIds, setSearchQuery } =
	inventorySlice.actions;

// Create the browser Redux store.
export const makeStore = () =>
	configureStore({
		reducer: { inventory: inventorySlice.reducer },
	});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
