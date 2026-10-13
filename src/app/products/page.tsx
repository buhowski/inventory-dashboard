'use client';

import dynamic from 'next/dynamic';

// Load the product workspace on demand.
const ProductsView = dynamic(
	() => import('@/components/products-view').then((module) => module.ProductsView),
	{ loading: () => <div className='loading__skeleton' aria-label='Loading products' /> },
);

export default function ProductsPage() {
	return <ProductsView />;
}
