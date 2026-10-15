import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { Suspense } from 'react';
import { InventoryShell } from '@/components/inventory-shell';
import { Providers } from '@/components/providers';
import { PwaRegistration } from '@/components/pwa-registration';
import '../styles/main.scss';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Stockroom — Inventory',
	description: 'Track incoming orders and keep your product inventory in sync.',
	applicationName: 'Stockroom',
	manifest: '/manifest.webmanifest',
	appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Stockroom' },
};

// Configure installable app colors.
export const viewport: Viewport = {
	themeColor: '#f4f6f8',
	width: 'device-width',
	initialScale: 1,
};

// Provide global inventory services.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang='en' className={geistSans.variable}>
			<body>
				<Suspense
					fallback={
						<div className='app__fallback' role='status'>
							Loading Stockroom…
						</div>
					}
				>
					<Providers>
						<PwaRegistration />

						<InventoryShell>{children}</InventoryShell>
					</Providers>
				</Suspense>
			</body>
		</html>
	);
}
