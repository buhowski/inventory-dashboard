'use client';

import dynamic from 'next/dynamic';

const ReceiptsView = dynamic(
	() => import('@/components/receipts-view').then((module) => module.ReceiptsView),
	{ loading: () => <div className='loading__skeleton' aria-label='Loading receipts' /> },
);

export default function ReceiptsPage() {
	return <ReceiptsView />;
}
