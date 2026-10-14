'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import {
	loadInventory,
	makeStore,
	setDeletedOrderIds,
	setDeletedProductIds,
	type AppStore,
} from '@/lib/store';

const deletedOrderStorageKey = 'inventory.deletedOrders';
const deletedProductStorageKey = 'inventory.deletedProducts';

// Restore inventory in the browser.
export function Providers({ children }: { children: ReactNode }) {
	const [store] = useState<AppStore>(makeStore);
	const [serverState] = useState(() => store.getState());

	useEffect(() => {
		try {
			const storedOrderIds = window.localStorage.getItem(deletedOrderStorageKey);
			const storedProductIds = window.localStorage.getItem(deletedProductStorageKey);
			if (storedOrderIds) {
				const parsedIds: unknown = JSON.parse(storedOrderIds);
				if (Array.isArray(parsedIds) && parsedIds.every((id) => typeof id === 'string')) {
					store.dispatch(setDeletedOrderIds(parsedIds));
				}
			}
			if (storedProductIds) {
				const parsedIds: unknown = JSON.parse(storedProductIds);
				if (Array.isArray(parsedIds) && parsedIds.every((id) => typeof id === 'string')) {
					store.dispatch(setDeletedProductIds(parsedIds));
				}
			}
		} catch (error) {
			console.error('Unable to restore saved inventory preferences.', error);
		}

		void store.dispatch(loadInventory());
	}, [store]);

	return (
		<Provider store={store} serverState={serverState}>
			{children}
		</Provider>
	);
}
