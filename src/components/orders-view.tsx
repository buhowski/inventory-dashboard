'use client';

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	ArrowRight,
	Box,
	CalendarDays,
	Clock3,
	List,
	Plus,
	RotateCcw,
	Trash2,
	X,
} from '@/components/icons';
import { MetricCard } from '@/components/ui/metric-card';
import { PageFeedback } from '@/components/ui/page-feedback';
import { PageHeading } from '@/components/ui/page-heading';
import { ProductThumbnail } from '@/components/ui/product-thumbnail';
import { CatalogRestoreButton } from '@/components/ui/catalog-restore-button';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { NewReceiptDialog } from '@/components/ui/new-receipt-dialog';
import { productTypes as availableProductTypes } from '@/lib/data';
import {
	clearLocalInventory,
	deletedOrderStorageKey,
	deletedProductStorageKey,
	persistDeletedId,
} from '@/lib/deleted-inventory';
import { persistCreatedInventory } from '@/lib/local-inventory';
import {
	formatCompactDate,
	formatDate,
	formatPrice,
	getOrderProducts,
	getOrderSearchText,
	getOrderTotals,
	matchesSearch,
} from '@/lib/inventory';
import {
	addOrderWithProducts,
	deleteOrder,
	deleteProduct,
	loadInventory,
	resetDeletedInventory,
	selectOrder,
	setSearchQuery,
	type AppDispatch,
	type RootState,
} from '@/lib/store';
import type { Order, Product } from '@/lib/types';

export function OrdersView() {
	const dispatch = useDispatch<AppDispatch>();
	const { orders, products, searchQuery, selectedOrderId, status, error } = useSelector(
		(state: RootState) => state.inventory,
	);
	const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [pendingProductDelete, setPendingProductDelete] = useState<Product | null>(null);
	const [productDeleteError, setProductDeleteError] = useState<string | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [restoreError, setRestoreError] = useState<string | null>(null);

	const visibleOrders = useMemo(
		() => orders.filter((order) => matchesSearch(getOrderSearchText(order), searchQuery)),
		[orders, searchQuery],
	);
	const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
	const totalUnits = orders.reduce((total, order) => total + order.productIds.length, 0);
	const uniqueTypes = new Set(products.map(({ type }) => type)).size;
	const receiptProductTypes = useMemo(
		() => [...new Set([...availableProductTypes, ...products.map(({ type }) => type)])].sort(),
		[products],
	);

	const restoreDemoInventory = () => {
		try {
			clearLocalInventory(window.localStorage);
			dispatch(resetDeletedInventory());
			dispatch(setSearchQuery(''));
			setRestoreError(null);
			void dispatch(loadInventory());
		} catch (caughtError) {
			console.error('Unable to restore demo inventory.', caughtError);
			setRestoreError(
				'Demo inventory could not be restored. Check your browser storage and try again.',
			);
		}
	};

	// Persist deletions across visits
	const confirmDelete = () => {
		if (!pendingDelete) return;
		try {
			persistDeletedId(window.localStorage, deletedOrderStorageKey, pendingDelete.id);
			dispatch(deleteOrder(pendingDelete.id));
			dispatch(selectOrder(null));
			setPendingDelete(null);
			setDeleteError(null);
		} catch (caughtError) {
			console.error('Unable to save the deleted order.', caughtError);
			setDeleteError('This order could not be deleted. Check your browser storage and try again.');
		}
	};

	const confirmProductDelete = () => {
		if (!pendingProductDelete) return;
		try {
			persistDeletedId(window.localStorage, deletedProductStorageKey, pendingProductDelete.id);
			dispatch(deleteProduct(pendingProductDelete.id));
			setPendingProductDelete(null);
			setProductDeleteError(null);
		} catch (caughtError) {
			console.error('Unable to save the deleted product.', caughtError);
			setProductDeleteError(
				'This product could not be deleted. Check your browser storage and try again.',
			);
		}
	};

	const createReceipt = (order: Order, newProducts: Product[]) => {
		try {
			persistCreatedInventory(window.localStorage, order, newProducts);
			dispatch(addOrderWithProducts({ order, products: newProducts }));
			dispatch(setSearchQuery(''));
			dispatch(selectOrder(order.id));
			setCreateError(null);
			setIsCreateOpen(false);
		} catch (caughtError) {
			console.error('Unable to save the new receipt in this browser.', caughtError);
			setCreateError(
				'This receipt could not be saved in this browser. Check available storage and try again.',
			);
		}
	};

	if (status === 'loading' || status === 'idle') {
		return <PageFeedback kind='loading' message='Loading your orders…' />;
	}
	if (status === 'failed') {
		return <PageFeedback kind='error' message={error ?? 'Inventory could not be loaded.'} />;
	}

	return (
		<section className='page'>
			<PageHeading
				eyebrow='INVENTORY / ORDERS'
				title='Orders'
				count={orders.length}
				description='Every delivery, organized and accounted for.'
				action={
					<button
						className='button button--primary'
						type='button'
						onClick={() => {
							setCreateError(null);
							setIsCreateOpen(true);
						}}
					>
						<Plus size={17} /> New receipt
					</button>
				}
			/>

			<div className='overview'>
				<MetricCard
					icon={<List size={17} />}
					tone='green'
					label='TOTAL ORDERS'
					value={orders.length.toString().padStart(2, '0')}
					note='Live'
					noteTone='trend'
				/>

				<MetricCard
					icon={<Box size={17} />}
					tone='blue'
					label='PRODUCTS RECEIVED'
					value={totalUnits.toString().padStart(2, '0')}
					note='across all orders'
					noteTone='caption'
				/>

				<MetricCard
					icon={<Clock3 size={17} />}
					tone='purple'
					label='PRODUCT TYPES'
					value={uniqueTypes.toString().padStart(2, '0')}
					note='in your catalog'
					noteTone='caption'
				/>
			</div>

			<div className={`orders${selectedOrder ? ' orders--has-detail' : ''}`}>
				<section className='orders__section' aria-label='Incoming orders'>
					<div className='orders__heading'>
						<div>
							<h2>
								Recent orders <span>{visibleOrders.length}</span>
							</h2>

							<p>Select an order to inspect its products</p>
						</div>

						{/* <button className='orders__filter' type='button' disabled>
							<CalendarDays size={15} /> All time <ChevronRight size={14} />
						</button> */}
					</div>

					{visibleOrders.length ? (
						<div className='orders__list'>
							{visibleOrders.map((order, index) => {
								const orderProducts = getOrderProducts(order, products);
								const totals = getOrderTotals(orderProducts);
								const active = selectedOrderId === order.id;
								return (
									<article
										className={`order-card${active ? ' order-card--selected' : ''}`}
										key={order.id}
									>
										<button
											className='order-card__main'
											type='button'
											aria-pressed={active}
											onClick={() => dispatch(selectOrder(active ? null : order.id))}
										>
											<span className={`order-card__index`}>0{index + 1}</span>

											<span className='order-card__copy'>
												<span className='order-card__title'>{order.title}</span>

												<span className='order-card__count'>
													{orderProducts.length}{' '}
													{orderProducts.length === 1 ? 'product' : 'products'}
												</span>
											</span>

											<span className='order-card__meta'>
												<span className='order-card__date--short'>
													{formatCompactDate(order.date)}
												</span>

												<span className='order-card__date--long'>{formatDate(order.date)}</span>
											</span>

											<span className='order-card__total'>
												<strong>{formatPrice(totals.USD ?? 0, 'USD')}</strong>

												<span>{formatPrice(totals.UAH ?? 0, 'UAH')}</span>
											</span>

											<span className='order-card__open' aria-hidden='true'>
												<ArrowRight size={16} />
											</span>
										</button>

										<button
											className='icon-button order-card__delete'
											type='button'
											aria-label={`Delete ${order.title}`}
											onClick={() => {
												setDeleteError(null);
												setPendingDelete(order);
											}}
										>
											<Trash2 size={15} />
										</button>
									</article>
								);
							})}
						</div>
					) : (
						<div className='empty-state'>
							<span className='empty-state__icon'>
								{orders.length === 0 ? <RotateCcw size={20} /> : <List size={20} />}
							</span>

							<strong>{orders.length === 0 ? 'No orders left' : 'No matching orders'}</strong>

							<span>
								{orders.length === 0
									? 'There are no orders left. Restore the demo inventory to start over.'
									: 'Try another search term or clear the search.'}
							</span>
							{orders.length === 0 && <CatalogRestoreButton onClick={restoreDemoInventory} />}
						</div>
					)}
					{restoreError && (
						<p className='delete-dialog__error catalog__action-error' role='alert'>
							{restoreError}
						</p>
					)}
					<div className='orders__footnote'>
						<span className='orders__footnote-dot' />
						Showing the latest orders in your workspace
					</div>
				</section>

				{selectedOrder && (
					<OrderDetails
						order={selectedOrder}
						products={getOrderProducts(selectedOrder, products)}
						onClose={() => dispatch(selectOrder(null))}
						onDeleteProduct={(product) => {
							setProductDeleteError(null);
							setPendingProductDelete(product);
						}}
						onDelete={() => {
							setDeleteError(null);
							setPendingDelete(selectedOrder);
						}}
					/>
				)}
			</div>

			{pendingDelete && (
				<DeleteDialog
					order={pendingDelete}
					products={getOrderProducts(pendingDelete, products)}
					error={deleteError}
					onClose={() => {
						setPendingDelete(null);
						setDeleteError(null);
					}}
					onConfirm={confirmDelete}
				/>
			)}

			{pendingProductDelete && (
				<ProductDeleteDialog
					product={pendingProductDelete}
					error={productDeleteError}
					onClose={() => {
						setPendingProductDelete(null);
						setProductDeleteError(null);
					}}
					onConfirm={confirmProductDelete}
				/>
			)}

			{isCreateOpen && (
				<NewReceiptDialog
					productTypes={receiptProductTypes}
					existingSerialNumbers={products.map(({ serialNumber }) => serialNumber)}
					error={createError}
					onClose={() => {
						setIsCreateOpen(false);
						setCreateError(null);
					}}
					onCreate={createReceipt}
				/>
			)}
		</section>
	);
}

function OrderDetails({
	order,
	products,
	onClose,
	onDeleteProduct,
	onDelete,
}: {
	order: Order;
	products: ReturnType<typeof getOrderProducts>;
	onClose: () => void;
	onDeleteProduct: (product: Product) => void;
	onDelete: () => void;
}) {
	const totals = getOrderTotals(products);

	return (
		<aside className='order-details' aria-label={`Details for ${order.title}`}>
			<div className='order-details__top'>
				<div className='order-details__eyebrow'>
					<span className='eyebrow__dot' />
					ORDER DETAILS
				</div>

				<button
					className='icon-button order-details__close'
					type='button'
					onClick={onClose}
					aria-label='Close order details'
				>
					<X size={16} />
				</button>

				<h2>{order.title}</h2>

				<p className='order-details__description'>{order.description}</p>

				<div className='order-details__date'>
					<CalendarDays size={14} /> Received {formatDate(order.date)}
				</div>

				<div className='order-details__reference' aria-label={'Order ID ' + order.id}>
					<span>ORDER ID</span>
					<code>{order.id}</code>
				</div>
			</div>

			<div className='order-details__summary'>
				<div>
					<span>ITEMS</span>

					<strong>{products.length.toString().padStart(2, '0')}</strong>
				</div>

				<div>
					<span>ORDER TOTAL</span>

					<strong>{formatPrice(totals.USD ?? 0, 'USD')}</strong>
					<small>{formatPrice(totals.UAH ?? 0, 'UAH')}</small>
				</div>
			</div>

			<div className='order-details__products-heading'>
				<h3>Included products</h3>

				<span>{products.length}</span>
			</div>

			<div className='order-details__products'>
				{products.map((product) => (
					<div className='order-details__product' key={product.id}>
						<ProductThumbnail />

						<div className='order-details__product-copy'>
							<strong>{product.title}</strong>

							<span>{product.serialNumber}</span>
						</div>

						<span
							className={`order-details__status-dot ${product.status === 'Available' ? 'order-details__status-dot--available' : 'order-details__status-dot--repair'}`}
						/>
						<button
							className='icon-button order-details__product-delete'
							type='button'
							aria-label={`Delete ${product.title} from ${order.title}`}
							title={`Delete ${product.title}`}
							onClick={() => onDeleteProduct(product)}
						>
							<Trash2 size={14} />
						</button>
					</div>
				))}
			</div>

			<div className='order-details__footer'>
				<span>
					<span className='order-details__footer-dot' /> All items accounted for
				</span>

				<button className='text-button text-button--danger' type='button' onClick={onDelete}>
					<Trash2 size={14} /> Delete order
				</button>
			</div>
		</aside>
	);
}

function DeleteDialog({
	order,
	products,
	error,
	onClose,
	onConfirm,
}: {
	order: Order;
	products: ReturnType<typeof getOrderProducts>;
	error: string | null;
	onClose: () => void;
	onConfirm: () => void;
}) {
	return (
		<DeleteConfirmationDialog
			titleId='delete-title'
			title='Delete this order?'
			description={
				<>
					This will remove <strong>{order.title}</strong> and its products from your orders list.
				</>
			}
			details={
				<>
					{products.slice(0, 2).map((product) => (
						<div className='delete-dialog__product' key={product.id}>
							<span className='delete-dialog__product-indicator' />

							<ProductThumbnail />

							<span>
								<strong>{product.title}</strong>

								<small>{product.serialNumber}</small>
							</span>
						</div>
					))}
					{products.length > 2 && (
						<span className='delete-dialog__more-products'>+ {products.length - 2} more items</span>
					)}
				</>
			}
			error={error}
			cancelLabel='Keep order'
			confirmLabel='Delete order'
			onClose={onClose}
			onConfirm={onConfirm}
		/>
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
			titleId='delete-order-product-title'
			title='Delete this product?'
			description={
				<>
					This will remove <strong>{product.title}</strong> from the catalog and this order.
				</>
			}
			details={
				<div className='delete-dialog__product'>
					<span className='delete-dialog__product-indicator' />
					<ProductThumbnail />
					<span>
						<strong>{product.title}</strong>
						<small>{product.serialNumber}</small>
					</span>
				</div>
			}
			error={error}
			cancelLabel='Keep product'
			confirmLabel='Delete product'
			onClose={onClose}
			onConfirm={onConfirm}
		/>
	);
}
