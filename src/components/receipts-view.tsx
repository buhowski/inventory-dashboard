'use client';

import { useId, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	ArrowRight,
	Box,
	CalendarDays,
	ChevronDown,
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
	deletedReceiptStorageKey,
	deletedProductStorageKey,
	persistDeletedId,
} from '@/lib/deleted-inventory';
import { persistCreatedInventory } from '@/lib/local-inventory';
import {
	formatCompactDate,
	formatDate,
	formatPrice,
	getReceiptProducts,
	getReceiptSearchText,
	getReceiptTotals,
	matchesSearch,
} from '@/lib/inventory';
import {
	addReceiptWithProducts,
	deleteReceipt,
	deleteProduct,
	loadInventory,
	resetDeletedInventory,
	selectReceipt,
	setSearchQuery,
	type AppDispatch,
	type RootState,
} from '@/lib/store';
import type { Receipt, Product } from '@/lib/types';

export function ReceiptsView() {
	const dispatch = useDispatch<AppDispatch>();
	const { receipts, products, searchQuery, selectedReceiptId, status, error } = useSelector(
		(state: RootState) => state.inventory,
	);
	const [pendingDelete, setPendingDelete] = useState<Receipt | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [pendingProductDelete, setPendingProductDelete] = useState<Product | null>(null);
	const [productDeleteError, setProductDeleteError] = useState<string | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [restoreError, setRestoreError] = useState<string | null>(null);

	const visibleReceipts = useMemo(
		() => receipts.filter((receipt) => matchesSearch(getReceiptSearchText(receipt), searchQuery)),
		[receipts, searchQuery],
	);
	const selectedReceipt = receipts.find((receipt) => receipt.id === selectedReceiptId) ?? null;
	const totalUnits = receipts.reduce((total, receipt) => total + receipt.productIds.length, 0);
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
			persistDeletedId(window.localStorage, deletedReceiptStorageKey, pendingDelete.id);
			dispatch(deleteReceipt(pendingDelete.id));
			dispatch(selectReceipt(null));
			setPendingDelete(null);
			setDeleteError(null);
		} catch (caughtError) {
			console.error('Unable to save the deleted receipt.', caughtError);
			setDeleteError(
				'This receipt could not be deleted. Check your browser storage and try again.',
			);
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

	const createReceipt = (receipt: Receipt, newProducts: Product[]) => {
		try {
			persistCreatedInventory(window.localStorage, receipt, newProducts);
			dispatch(addReceiptWithProducts({ receipt, products: newProducts }));
			dispatch(setSearchQuery(''));
			dispatch(selectReceipt(receipt.id));
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
		return <PageFeedback kind='loading' message='Loading your receipts…' />;
	}
	if (status === 'failed') {
		return <PageFeedback kind='error' message={error ?? 'Inventory could not be loaded.'} />;
	}

	return (
		<section className='page'>
			<PageHeading
				eyebrow='INVENTORY / RECEIPTS'
				title='Receipts'
				count={receipts.length}
				description='Track incoming stock and the products added to inventory.'
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
					label='TOTAL RECEIPTS'
					value={receipts.length.toString().padStart(2, '0')}
					note='Live'
					noteTone='trend'
				/>

				<MetricCard
					icon={<Box size={17} />}
					tone='blue'
					label='PRODUCTS RECEIVED'
					value={totalUnits.toString().padStart(2, '0')}
					note='across all receipts'
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

			<div className={`receipts${selectedReceipt ? ' receipts--has-detail' : ''}`}>
				<section className='receipts__section' aria-label='Incoming receipts'>
					<div className='receipts__heading'>
						<div>
							<h2>
								Recent receipts <span>{visibleReceipts.length}</span>
							</h2>

							<p>Select a receipt to inspect its products</p>
						</div>

						{/* <button className='receipts__filter' type='button' disabled>
							<CalendarDays size={15} /> All time <ChevronRight size={14} />
						</button> */}
					</div>

					{visibleReceipts.length ? (
						<div className='receipts__list'>
							{visibleReceipts.map((receipt, index) => {
								const receiptProducts = getReceiptProducts(receipt, products);
								const totals = getReceiptTotals(receiptProducts);
								const active = selectedReceiptId === receipt.id;
								return (
									<article
										className={`receipt-card${active ? ' receipt-card--selected' : ''}`}
										key={receipt.id}
									>
										<button
											className='receipt-card__main'
											type='button'
											aria-pressed={active}
											onClick={() => dispatch(selectReceipt(active ? null : receipt.id))}
										>
											<span className={`receipt-card__index`}>0{index + 1}</span>

											<span className='receipt-card__copy'>
												<span className='receipt-card__title'>{receipt.title}</span>

												<span className='receipt-card__count'>
													{receiptProducts.length}{' '}
													{receiptProducts.length === 1 ? 'product' : 'products'}
												</span>
											</span>

											<span className='receipt-card__meta'>
												<span className='receipt-card__date--short'>
													{formatCompactDate(receipt.receivedAt)}
												</span>

												<span className='receipt-card__date--long'>
													{formatDate(receipt.receivedAt)}
												</span>
											</span>

											<span className='receipt-card__total'>
												<strong>{formatPrice(totals.USD ?? 0, 'USD')}</strong>

												<span>{formatPrice(totals.UAH ?? 0, 'UAH')}</span>
											</span>

											<span className='receipt-card__open' aria-hidden='true'>
												<ArrowRight size={16} />
											</span>
										</button>

										<button
											className='icon-button receipt-card__delete'
											type='button'
											aria-label={`Delete ${receipt.title}`}
											onClick={() => {
												setDeleteError(null);
												setPendingDelete(receipt);
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
								{receipts.length === 0 ? <RotateCcw size={20} /> : <List size={20} />}
							</span>

							<strong>
								{receipts.length === 0 ? 'No receipts recorded' : 'No matching receipts'}
							</strong>

							<span>
								{receipts.length === 0
									? 'Restore the demo inventory to see sample stock receipts.'
									: 'Try another search term or clear the search.'}
							</span>
							{receipts.length === 0 && <CatalogRestoreButton onClick={restoreDemoInventory} />}
						</div>
					)}
					{restoreError && (
						<p className='delete-dialog__error catalog__action-error' role='alert'>
							{restoreError}
						</p>
					)}
					<div className='receipts__footnote'>
						<span className='receipts__footnote-dot' />
						Showing the latest receipts in your workspace
					</div>
				</section>

				{selectedReceipt && (
					<ReceiptDetails
						receipt={selectedReceipt}
						products={getReceiptProducts(selectedReceipt, products)}
						onClose={() => dispatch(selectReceipt(null))}
						onDeleteProduct={(product) => {
							setProductDeleteError(null);
							setPendingProductDelete(product);
						}}
						onDelete={() => {
							setDeleteError(null);
							setPendingDelete(selectedReceipt);
						}}
					/>
				)}
			</div>

			{pendingDelete && (
				<DeleteDialog
					receipt={pendingDelete}
					products={getReceiptProducts(pendingDelete, products)}
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

function ReceiptDetails({
	receipt,
	products,
	onClose,
	onDeleteProduct,
	onDelete,
}: {
	receipt: Receipt;
	products: ReturnType<typeof getReceiptProducts>;
	onClose: () => void;
	onDeleteProduct: (product: Product) => void;
	onDelete: () => void;
}) {
	const totals = getReceiptTotals(products);

	return (
		<aside className='receipt-details' aria-label={`Details for ${receipt.title}`}>
			<div className='receipt-details__top'>
				<div className='receipt-details__eyebrow'>
					<span className='eyebrow__dot' />
					RECEIPT DETAILS
				</div>

				<button
					className='icon-button receipt-details__close'
					type='button'
					onClick={onClose}
					aria-label='Close receipt details'
				>
					<X size={16} />
				</button>

				<h2>{receipt.title}</h2>

				<p className='receipt-details__description'>{receipt.description}</p>

				<div className='receipt-details__date'>
					<CalendarDays size={14} /> Received {formatDate(receipt.receivedAt)}
				</div>

				<div className='receipt-details__reference' aria-label={'Receipt ID ' + receipt.id}>
					<span>RECEIPT ID</span>
					<code>{receipt.id}</code>
				</div>
			</div>

			<div className='receipt-details__summary'>
				<div>
					<span>ITEMS</span>

					<strong>{products.length.toString().padStart(2, '0')}</strong>
				</div>

				<div>
					<span>TOTAL VALUE</span>

					<strong>{formatPrice(totals.USD ?? 0, 'USD')}</strong>
					<small>{formatPrice(totals.UAH ?? 0, 'UAH')}</small>
				</div>
			</div>

			<div className='receipt-details__products-heading'>
				<h3>Included products</h3>

				<span>{products.length}</span>
			</div>

			<div className='receipt-details__products'>
				{products.map((product) => (
					<div className='receipt-details__product' key={product.id}>
						<ProductThumbnail />

						<div className='receipt-details__product-copy'>
							<strong>{product.title}</strong>

							<span>{product.serialNumber}</span>
						</div>

						<span
							className={`receipt-details__status-dot ${product.status === 'Available' ? 'receipt-details__status-dot--available' : 'receipt-details__status-dot--repair'}`}
						/>
						<button
							className='icon-button receipt-details__product-delete'
							type='button'
							aria-label={`Delete ${product.title} from ${receipt.title}`}
							title={`Delete ${product.title}`}
							onClick={() => onDeleteProduct(product)}
						>
							<Trash2 size={14} />
						</button>
					</div>
				))}
			</div>

			<div className='receipt-details__footer'>
				<span>
					<span className='receipt-details__footer-dot' /> All items accounted for
				</span>

				<button className='text-button text-button--danger' type='button' onClick={onDelete}>
					<Trash2 size={14} /> Delete receipt
				</button>
			</div>
		</aside>
	);
}

function DeleteDialog({
	receipt,
	products,
	error,
	onClose,
	onConfirm,
}: {
	receipt: Receipt;
	products: ReturnType<typeof getReceiptProducts>;
	error: string | null;
	onClose: () => void;
	onConfirm: () => void;
}) {
	const [showAllProducts, setShowAllProducts] = useState(false);
	const extraProductsId = useId();
	const extraProducts = products.slice(2);

	return (
		<DeleteConfirmationDialog
			titleId='delete-title'
			title='Delete this receipt?'
			description={
				<>
					This will remove <strong>{receipt.title}</strong> and its products from your receipts
					list.
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
					{extraProducts.length > 0 && (
						<>
							<div
								className='delete-dialog__extra-products'
								id={extraProductsId}
								role='region'
								aria-label='Additional products in this receipt'
								tabIndex={0}
								hidden={!showAllProducts}
							>
								{extraProducts.map((product) => (
									<div className='delete-dialog__product' key={product.id}>
										<span className='delete-dialog__product-indicator' />

										<ProductThumbnail />

										<span>
											<strong>{product.title}</strong>

											<small>{product.serialNumber}</small>
										</span>
									</div>
								))}
							</div>

							<button
								className='delete-dialog__more-products'
								type='button'
								aria-controls={extraProductsId}
								aria-expanded={showAllProducts}
								onClick={() => setShowAllProducts((isExpanded) => !isExpanded)}
							>
								<span>
									{showAllProducts
										? 'Show fewer products'
										: `Show ${extraProducts.length} more ${extraProducts.length === 1 ? 'product' : 'products'}`}
								</span>
								<ChevronDown
									size={12}
									className='delete-dialog__more-products-icon'
									aria-hidden='true'
								/>
							</button>
						</>
					)}
				</>
			}
			error={error}
			cancelLabel='Keep receipt'
			confirmLabel='Delete receipt'
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
			titleId='delete-receipt-product-title'
			title='Delete this product?'
			description={
				<>
					This will remove <strong>{product.title}</strong> from the catalog and this receipt.
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
