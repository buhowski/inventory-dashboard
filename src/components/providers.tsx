'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import {
	deletedOrderStorageKey,
	deletedProductStorageKey,
	readDeletedIds,
} from '@/lib/deleted-inventory';
import {
	loadInventory,
	makeStore,
	setDeletedOrderIds,
	setDeletedProductIds,
	type AppStore,
} from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
	const [store] = useState<AppStore>(makeStore);
	const [serverState] = useState(() => store.getState());

	useEffect(() => {
		// Restore deleted IDs before loading inventory
		try {
			const deletedOrderIds = readDeletedIds(window.localStorage, deletedOrderStorageKey);
			const deletedProductIds = readDeletedIds(window.localStorage, deletedProductStorageKey);
			if (deletedOrderIds.length) store.dispatch(setDeletedOrderIds(deletedOrderIds));
			if (deletedProductIds.length) store.dispatch(setDeletedProductIds(deletedProductIds));
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
