'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, ChevronRight, Monitor, SlidersHorizontal, Trash2 } from '@/components/icons';
import { PageFeedback } from '@/components/ui/page-feedback';
import { PageHeading } from '@/components/ui/page-heading';
import {
	formatCompactDate,
	formatDate,
	formatPrice,
	getProductSearchText,
	matchesSearch,
} from '@/lib/inventory';
import { selectOrder, type AppDispatch, type RootState } from '@/lib/store';

// Filter and inspect catalog items.
export function ProductsView() {
	const { orders, products, searchQuery, status, error } = useSelector(
		(state: RootState) => state.inventory,
	);
	const dispatch = useDispatch<AppDispatch>();
	const [selectedType, setSelectedType] = useState('All products');
	const types = useMemo(() => [...new Set(products.map(({ type }) => type))].sort(), [products]);
	const visibleProducts = useMemo(
		() =>
			products.filter((product) => {
				const order = orders.find(({ id }) => id === product.orderId);
				return (
					(selectedType === 'All products' || product.type === selectedType) &&
					matchesSearch(getProductSearchText(product, order), searchQuery)
				);
			}),
		[orders, products, searchQuery, selectedType],
	);

	if (status === 'loading' || status === 'idle') {
		return <PageFeedback kind='loading' message='Loading your products…' />;
	}
	if (status === 'failed') {
		return <PageFeedback kind='error' message={error ?? 'Inventory could not be loaded.'} />;
	}

	return (
		<section className='page'>
			<PageHeading
				className='catalog__heading'
				eyebrow='INVENTORY / CATALOG'
				title='Products'
				count={visibleProducts.length}
				description='Everything in your inventory, at a glance.'
				action={
					<label className='catalog__filter'>
						<SlidersHorizontal size={15} />
						<span>Category</span>
						<select
							value={selectedType}
							onChange={(event) => setSelectedType(event.target.value)}
							aria-label='Filter products by category'
						>
							<option>All products</option>
							{types.map((type) => (
								<option key={type}>{type}</option>
							))}
						</select>
						<ChevronDown size={14} className='catalog__filter-chevron' />
					</label>
				}
			/>

			<div className='catalog__toolbar'>
				<div className='catalog__toolbar-label'>
					<span className='catalog__toolbar-dot' /> ALL STOCK{' '}
					<span>{visibleProducts.length} ITEMS</span>
				</div>
				<button className='catalog__sort' type='button' disabled>
					Most recent <ChevronDown size={14} />
				</button>
			</div>

			{visibleProducts.length ? (
				<div className='catalog__table-wrap'>
					<table className='catalog__table'>
						<thead>
							<tr>
								<th scope='col'>Product</th>
								<th scope='col'>Status</th>
								<th scope='col'>Warranty period</th>
								<th scope='col'>Condition</th>
								<th scope='col'>Value</th>
								<th scope='col'>Order</th>
								<th scope='col'>
									<span className='sr-only'>Actions</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{visibleProducts.map((product, index) => {
								const order = orders.find(({ id }) => id === product.orderId);
								return (
									<tr key={product.id} style={{ animationDelay: `${index * 45}ms` }}>
										<td>
											<div className='catalog__product'>
												<span className='catalog__product-icon'>
													<Monitor size={20} strokeWidth={1.65} />
												</span>
												<span className='catalog__product-copy'>
													<strong>{product.title}</strong>
													<small>
														{product.serialNumber} <span>·</span> {product.type}
													</small>
												</span>
											</div>
										</td>
										<td>
											<span
												className={`catalog__status ${product.status === 'Available' ? 'catalog__status--available' : 'catalog__status--repair'}`}
											>
												<span />
												{product.status}
											</span>
										</td>
										<td>
											<div className='catalog__warranty'>
												<span>
													{formatCompactDate(product.guarantee.start)} <ChevronRight size={12} />{' '}
													{formatCompactDate(product.guarantee.end)}
												</span>
												<small>
													{formatDate(product.guarantee.start)} —{' '}
													{formatDate(product.guarantee.end)}
												</small>
											</div>
										</td>
										<td>
											<span
												className={`catalog__condition${product.isNew ? '' : ' catalog__condition--used'}`}
											>
												{product.isNew ? 'New' : 'Pre-owned'}
											</span>
										</td>
										<td>
											<div className='catalog__value'>
												{product.prices.map((price) => (
													<span key={price.currency}>
														{formatPrice(price.value, price.currency)}
													</span>
												))}
											</div>
										</td>
										<td>
											{order ? (
												<Link
													className='catalog__order-link'
													href='/orders'
													onClick={() => dispatch(selectOrder(order.id))}
												>
													{order.title}
													<small>{order.id}</small>
												</Link>
											) : (
												<span className='catalog__unlinked-order'>—</span>
											)}
										</td>
										<td>
											<button
												className='icon-button catalog__action'
												type='button'
												aria-label={`Remove ${product.title}`}
												disabled
												title='Product removal is not available in this demo'
											>
												<Trash2 size={15} />
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					<div className='catalog__table-footer'>
						<span>
							Showing <strong>{visibleProducts.length}</strong> of{' '}
							<strong>{products.length}</strong> products
						</span>
						<span>Values shown in USD and UAH</span>
					</div>
				</div>
			) : (
				<div className='empty-state empty-state--catalog'>
					<span className='empty-state__icon'>
						<Monitor size={20} />
					</span>
					<strong>No products found</strong>
					<span>Adjust the category filter or try a different search.</span>
				</div>
			)}
			<div className='catalog__note'>
				<span>
					<span className='catalog__note-check'>✓</span> Inventory is up to date
				</span>
				<span>Synced just now</span>
			</div>
		</section>
	);
}
