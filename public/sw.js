const CACHE_NAME = 'stockroom-shell-v1';
const OFFLINE_PAGE = '/offline.html';

// Cache the offline fallback.
self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_PAGE)));
	self.skipWaiting();
});

// Remove outdated app caches.
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
			),
	);
	self.clients.claim();
});

// Keep API responses fresh.
self.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);

	if (
		request.method !== 'GET' ||
		url.origin !== self.location.origin ||
		url.pathname.startsWith('/api/') ||
		url.pathname.startsWith('/socket.io/')
	) {
		return;
	}

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).catch(async () => {
				const cached = await caches.match(OFFLINE_PAGE);
				if (!cached) throw new Error('Offline fallback is unavailable.');
				return cached;
			}),
		);
		return;
	}

	if (url.pathname.startsWith('/_next/static/')) {
		event.respondWith(
			caches.open(CACHE_NAME).then(async (cache) => {
				const cached = await cache.match(request);
				if (cached) return cached;
				const response = await fetch(request);
				if (response.ok) await cache.put(request, response.clone());
				return response;
			}),
		);
	}
});
