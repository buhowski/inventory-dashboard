'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import {
	ChevronDown,
	ChevronRight,
	Monitor,
	RotateCcw,
	SlidersHorizontal,
	Trash2,
} from '@/components/icons';
import { PageFeedback } from '@/components/ui/page-feedback';
import { PageHeading } from '@/components/ui/page-heading';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { CatalogRestoreButton } from '@/components/ui/catalog-restore-button';
import {
	clearDeletedInventory,
	deletedProductStorageKey,
	persistDeletedId,
} from '@/lib/deleted-inventory';
import {
	formatCompactDate,
	formatDate,
	formatPrice,
	getProductSearchText,
	matchesSearch,
} from '@/lib/inventory';
import {
	deleteProduct,
	loadInventory,
	resetDeletedInventory,
	selectOrder,
	setSearchQuery,
	type AppDispatch,
	type RootState,
} from '@/lib/store';
import type { Product } from '@/lib/types';

export function ProductsView() {
	const { orders, products, searchQuery, status, error } = useSelector(
		(state: RootState) => state.inventory,
	);
	const dispatch = useDispatch<AppDispatch>();
	const [selectedType, setSelectedType] = useState('All products');
	const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const types = useMemo(() => [...new Set(products.map(({ type }) => type))].sort(), [products]);
	const ordersById = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders]);
	const visibleProducts = useMemo(
		() =>
			products.filter((product) => {
				const order = ordersById.get(product.orderId);
				return (
					(selectedType === 'All products' || product.type === selectedType) &&
					matchesSearch(getProductSearchText(product, order), searchQuery)
				);
			}),
		[ordersById, products, searchQuery, selectedType],
	);

	const confirmDelete = () => {
		if (!pendingDelete) return;
		try {
			persistDeletedId(window.localStorage, deletedProductStorageKey, pendingDelete.id);
			dispatch(deleteProduct(pendingDelete.id));
			setPendingDelete(null);
			setActionError(null);
		} catch (error) {
			console.error('Unable to save the deleted product.', error);
			setActionError(
				'This product could not be deleted. Check your browser storage and try again.',
			);
		}
	};

	const restoreDemoProducts = () => {
		try {
			clearDeletedInventory(window.localStorage);
			dispatch(resetDeletedInventory());
			dispatch(setSearchQuery(''));
			setSelectedType('All products');
			setActionError(null);
			void dispatch(loadInventory());
		} catch (error) {
			console.error('Unable to restore demo products.', error);
			setActionError(
				'Demo products could not be restored. Check your browser storage and try again.',
			);
		}
	};

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

						<span>Type</span>

						<select
							value={selectedType}
							onChange={(event) => setSelectedType(event.target.value)}
							aria-label='Filter products by type'
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
								const order = ordersById.get(product.orderId);
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
												aria-label={`Delete ${product.title}`}
												title={`Delete ${product.title}`}
												onClick={() => {
													setActionError(null);
													setPendingDelete(product);
												}}
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
						{products.length === 0 ? <RotateCcw size={20} /> : <Monitor size={20} />}
					</span>

					<strong>{products.length === 0 ? 'No products left' : 'No products found'}</strong>

					<span>
						{products.length === 0
							? 'The catalog is empty. Restore the demo inventory to start over.'
							: 'Adjust the type filter or clear the search.'}
					</span>
					{products.length === 0 ? (
						<CatalogRestoreButton onClick={restoreDemoProducts} />
					) : (
						<button
							className='button button--quiet catalog__clear-filters'
							type='button'
							onClick={() => {
								setSelectedType('All products');
								dispatch(setSearchQuery(''));
							}}
						>
							Clear filters
						</button>
					)}
				</div>
			)}
			{actionError && !pendingDelete && (
				<p className='delete-dialog__error catalog__action-error' role='alert'>
					{actionError}
				</p>
			)}
			{pendingDelete && (
				<ProductDeleteDialog
					product={pendingDelete}
					error={actionError}
					onClose={() => {
						setPendingDelete(null);
						setActionError(null);
					}}
					onConfirm={confirmDelete}
				/>
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

function ProductDeleteDialog({
	product,
	error,
	onClose,
	onConfirm,
}: {
	product: Product;
	error: string | null;
	onClose: () => void;
	onConfirm: () => void;
}) {
	return (
		<DeleteConfirmationDialog
			titleId='delete-product-title'
			title='Delete this product?'
			description={
				<>
					This will remove <strong>{product.title}</strong> from the catalog and its order.
				</>
			}
			details={
				<div className='delete-dialog__product'>
					<span className='delete-dialog__product-indicator' />

					<span>
						<strong>{product.title}</strong>

						<small>{product.serialNumber}</small>
					</span>
				</div>
			}
			error={error}
			cancelLabel='Cancel'
			confirmLabel='Delete product'
			onClose={onClose}
			onConfirm={onConfirm}
		/>
	);
}
