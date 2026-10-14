'use client';

import { useEffect } from 'react';

// Register offline app support in production only.
export function PwaRegistration() {
	useEffect(() => {
		if (!('serviceWorker' in navigator)) return;

		if (process.env.NODE_ENV !== 'production') {
			const appWorkerUrl = new URL('/sw.js', window.location.origin).href;
			const isControlledByAppWorker =
				navigator.serviceWorker.controller?.scriptURL === appWorkerUrl;
			void navigator.serviceWorker
				.getRegistrations()
				.then(async (registrations) => {
					const appRegistrations = registrations.filter((registration) =>
						[registration.active, registration.waiting, registration.installing].some(
							(worker) => worker?.scriptURL === appWorkerUrl,
						),
					);
					await Promise.all(appRegistrations.map((registration) => registration.unregister()));
					await caches.delete('stockroom-shell-v1');
					if (isControlledByAppWorker) window.location.reload();
				})
				.catch((error: unknown) => {
					console.error('Unable to disable the production service worker in development.', error);
				});
			return;
		}

		void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
			console.error('Service worker registration failed.', error);
		});
	}, []);

	return null;
}
