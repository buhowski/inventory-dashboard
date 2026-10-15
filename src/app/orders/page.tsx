'use client';

import dynamic from 'next/dynamic';

const OrdersView = dynamic(
	() => import('@/components/orders-view').then((module) => module.OrdersView),
	{ loading: () => <div className='loading__skeleton' aria-label='Loading orders' /> },
);

export default function OrdersPage() {
	return <OrdersView />;
}
