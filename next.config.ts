import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	cacheComponents: true,
	partialPrefetching: true,
	async redirects() {
		return [
			{
				source: '/',
				destination: '/orders',
				permanent: false,
			},
		];
	},
};

export default nextConfig;
