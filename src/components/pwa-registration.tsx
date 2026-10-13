'use client';

import { useEffect } from 'react';

// Register offline app support.
export function PwaRegistration() {
	useEffect(() => {
		if (!('serviceWorker' in navigator)) return;

		void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
			console.error('Service worker registration failed.', error);
		});
	}, []);

	return null;
}
