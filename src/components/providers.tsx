'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { loadInventory, makeStore, setDeletedOrderIds, type AppStore } from '@/lib/store';

const storageKey = 'inventory.deletedOrders';

// Restore inventory in the browser.
export function Providers({ children }: { children: ReactNode }) {
	const [store] = useState<AppStore>(makeStore);
	const [serverState] = useState(() => store.getState());

	useEffect(() => {
		try {
			const storedIds = window.localStorage.getItem(storageKey);
			if (storedIds) {
				const parsedIds: unknown = JSON.parse(storedIds);
				if (Array.isArray(parsedIds) && parsedIds.every((id) => typeof id === 'string')) {
					store.dispatch(setDeletedOrderIds(parsedIds));
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
