'use client';

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	ArrowRight,
	Box,
	CalendarDays,
	ChevronRight,
	Clock3,
	List,
	Plus,
	Trash2,
	X,
} from '@/components/icons';
import { MetricCard } from '@/components/ui/metric-card';
import { PageFeedback } from '@/components/ui/page-feedback';
import { PageHeading } from '@/components/ui/page-heading';
import { ProductThumbnail } from '@/components/ui/product-thumbnail';
import {
	formatCompactDate,
	formatDate,
	formatPrice,
	getOrderProducts,
	getOrderSearchText,
	getOrderTotals,
	matchesSearch,
} from '@/lib/inventory';
import { deleteOrder, selectOrder, type AppDispatch, type RootState } from '@/lib/store';
import type { Order } from '@/lib/types';

const storageKey = 'inventory.deletedOrders';

// Show and manage incoming receipts.
export function OrdersView() {
	const dispatch = useDispatch<AppDispatch>();
	const { orders, products, searchQuery, selectedOrderId, status, error } = useSelector(
		(state: RootState) => state.inventory,
	);
	const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const visibleOrders = useMemo(
		() => orders.filter((order) => matchesSearch(getOrderSearchText(order), searchQuery)),
		[orders, searchQuery],
	);
	const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
	const totalUnits = orders.reduce((total, order) => total + order.productIds.length, 0);
	const uniqueTypes = new Set(products.map(({ type }) => type)).size;

	// Save deletions for the next visit.
	const confirmDelete = () => {
		if (!pendingDelete) return;
		try {
			const storedIds: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
			const deletedIds = Array.isArray(storedIds)
				? storedIds.filter((id): id is string => typeof id === 'string')
				: [];
			window.localStorage.setItem(
				storageKey,
				JSON.stringify([...new Set([...deletedIds, pendingDelete.id])]),
			);
			dispatch(deleteOrder(pendingDelete.id));
			dispatch(selectOrder(null));
			setPendingDelete(null);
			setDeleteError(null);
		} catch (caughtError) {
			console.error('Unable to save the deleted receipt.', caughtError);
			setDeleteError(
				'This receipt could not be deleted. Check your browser storage and try again.',
			);
		}
	};

	if (status === 'loading' || status === 'idle') {
		return <PageFeedback kind='loading' message='Loading your receipts…' />;
	}
	if (status === 'failed') {
		return <PageFeedback kind='error' message={error ?? 'Inventory could not be loaded.'} />;
	}

	return (
		<section className='page'>
			<PageHeading
				eyebrow='INVENTORY / RECEIPTS'
				title='Orders'
				count={orders.length}
				description='Every delivery, organized and accounted for.'
				action={
					<button
						className='button button--primary'
						type='button'
						disabled
						aria-disabled='true'
						title='Order creation is not available in this demo'
					>
						<Plus size={17} /> New order
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
					label='PRODUCT CATEGORIES'
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
							<p>Select a receipt to inspect its products</p>
						</div>
						<button className='orders__filter' type='button' disabled>
							<CalendarDays size={15} /> All time <ChevronRight size={14} />
						</button>
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
											<span
												className={`order-card__index${index === 0 ? ' order-card__index--highlight' : ''}`}
											>
												0{index + 1}
											</span>
											<span className='order-card__copy'>
												<span className='order-card__title'>{order.title}</span>
												<span className='order-card__id'>
													{order.id} <span className='order-card__separator'>·</span>{' '}
													{orderProducts.length} products
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
											<span className='order-card__open'>
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
								<List size={20} />
							</span>
							<strong>No matching orders</strong>
							<span>Try another search term or clear the search.</span>
						</div>
					)}
					<div className='orders__footnote'>
						<span className='orders__footnote-dot' />
						Showing the latest receipts in your workspace
					</div>
				</section>

				{selectedOrder && (
					<OrderDetails
						order={selectedOrder}
						products={getOrderProducts(selectedOrder, products)}
						onClose={() => dispatch(selectOrder(null))}
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
		</section>
	);
}

// Show linked receipt products.
function OrderDetails({
	order,
	products,
	onClose,
	onDelete,
}: {
	order: Order;
	products: ReturnType<typeof getOrderProducts>;
	onClose: () => void;
	onDelete: () => void;
}) {
	const totals = getOrderTotals(products);

	return (
		<aside className='order-details' aria-label={`Details for ${order.title}`}>
			<div className='order-details__top'>
				<div className='order-details__eyebrow'>
					<span className='eyebrow__dot' />
					RECEIPT DETAILS
				</div>
				<button
					className='icon-button order-details__close'
					type='button'
					onClick={onClose}
					aria-label='Close order details'
				>
					<X size={17} />
				</button>
				<h2>{order.title}</h2>
				<p className='order-details__description'>{order.description}</p>
				<div className='order-details__date'>
					<CalendarDays size={14} /> Received {formatDate(order.date)}
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

// Confirm permanent receipt removal.
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
		<div
			className='dialog-overlay'
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<section
				className='delete-dialog'
				role='alertdialog'
				aria-modal='true'
				aria-labelledby='delete-title'
			>
				<button
					className='icon-button delete-dialog__close'
					type='button'
					onClick={onClose}
					aria-label='Close confirmation'
				>
					<X size={18} />
				</button>
				<div className='delete-dialog__icon'>
					<Trash2 size={20} />
				</div>
				<p className='eyebrow'>PLEASE CONFIRM</p>
				<h2 id='delete-title'>Delete this order?</h2>
				<p className='delete-dialog__copy'>
					This will remove <strong>{order.title}</strong> and its receipt from your orders list.
				</p>
				<div className='delete-dialog__products'>
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
				</div>
				{error && (
					<p className='delete-dialog__error' role='alert'>
						{error}
					</p>
				)}
				<div className='delete-dialog__actions'>
					<button className='button button--quiet' type='button' onClick={onClose}>
						Keep order
					</button>
					<button className='button button--danger' type='button' onClick={onConfirm}>
						<Trash2 size={15} /> Delete order
					</button>
				</div>
			</section>
		</div>
	);
}
