'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import {
	deletedReceiptStorageKey,
	deletedProductStorageKey,
	readDeletedIds,
} from '@/lib/deleted-inventory';
import {
	loadInventory,
	makeStore,
	setDeletedReceiptIds,
	setDeletedProductIds,
	type AppStore,
} from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
	const [store] = useState<AppStore>(makeStore);
	const [serverState] = useState(() => store.getState());

	useEffect(() => {
		// Restore deleted IDs before loading inventory
		try {
			const deletedReceiptIds = readDeletedIds(
				window.localStorage,
				deletedReceiptStorageKey,
			);
			const deletedProductIds = readDeletedIds(
				window.localStorage,
				deletedProductStorageKey,
			);
			if (deletedReceiptIds.length)
				store.dispatch(setDeletedReceiptIds(deletedReceiptIds));
			if (deletedProductIds.length)
				store.dispatch(setDeletedProductIds(deletedProductIds));
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
