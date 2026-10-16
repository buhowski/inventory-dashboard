'use client';

import { useId, useState, type FormEvent } from 'react';
import { ChevronDown, Plus, Trash2, X } from '@/components/icons';
import { DialogOverlay } from '@/components/ui/dialog-overlay';
import type { Receipt, Product } from '@/lib/types';

type ProductDraft = {
	key: string;
	title: string;
	serialNumber: string;
	type: string;
	specification: string;
	isNew: 'new' | 'pre-owned';
	status: Product['status'];
	guaranteeStart: string;
	guaranteeEnd: string;
	priceUsd: string;
};

const USD_TO_UAH_RATE = 45;
const MAX_USD_PRICE = 222_222_222.22;

type NewReceiptDialogProps = {
	productTypes: string[];
	existingSerialNumbers: string[];
	error: string | null;
	onClose: () => void;
	onCreate: (receipt: Receipt, products: Product[]) => void;
};

function toDateInputValue(date: Date): string {
	const year = String(date.getFullYear()).padStart(4, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return year + '-' + month + '-' + day;
}

function dateAfterYears(value: string, years: number): string {
	const date = new Date(value + 'T12:00:00');
	if (!Number.isFinite(date.getTime())) return toDateInputValue(new Date());
	date.setFullYear(date.getFullYear() + years);
	return toDateInputValue(date);
}

function createDraftKey(): string {
	return (
		globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random()
	);
}

function createProductDraft(receivedDate: string): ProductDraft {
	const warrantyStart = isValidDateInput(receivedDate)
		? receivedDate
		: toDateInputValue(new Date());
	return {
		key: createDraftKey(),
		title: '',
		serialNumber: '',
		type: '',
		specification: '',
		isNew: 'new',
		status: 'Available',
		guaranteeStart: warrantyStart,
		guaranteeEnd: dateAfterYears(warrantyStart, 2),
		priceUsd: '',
	};
}

function createRecordId(prefix: 'RCT' | 'PRD'): string {
	return (
		prefix +
		'-' +
		globalThis.crypto
			.randomUUID()
			.replaceAll('-', '')
			.slice(0, 16)
			.toUpperCase()
	);
}

function isValidDateInput(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(value + 'T12:00:00');
	return Number.isFinite(date.getTime()) && toDateInputValue(date) === value;
}

function toStoredDate(value: string): string | null {
	if (!isValidDateInput(value)) return null;
	return new Date(value + 'T12:00:00').toISOString();
}

function parseUsdPrice(usdValue: string): number | null {
	const normalizedValue = usdValue.trim().replace(',', '.');
	if (!/^\d{1,9}(?:\.\d{0,2})?$/.test(normalizedValue)) return null;
	const usd = Number(normalizedValue);
	if (!Number.isFinite(usd) || usd > MAX_USD_PRICE) return null;
	return usd;
}

function getUsdPriceError(usdValue: string): string | null {
	if (!usdValue.trim()) return null;
	const normalizedValue = usdValue.trim().replace(',', '.');
	if (!/^\d{1,9}(?:\.\d{0,2})?$/.test(normalizedValue)) {
		return 'Use up to 9 digits';
	}
	if (Number(normalizedValue) > MAX_USD_PRICE) {
		return 'Price to high';
	}
	return null;
}

function calculateUahPrice(usdValue: string): number | null {
	const usd = parseUsdPrice(usdValue);
	if (usd === null) return null;
	const uahCents = Math.round((usd * USD_TO_UAH_RATE + Number.EPSILON) * 100);
	if (!Number.isSafeInteger(uahCents)) return null;
	return uahCents / 100;
}

function formatUahPrice(value: number): string {
	return new Intl.NumberFormat('en-GB', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function NewReceiptDialog({
	productTypes,
	existingSerialNumbers,
	error,
	onClose,
	onCreate,
}: NewReceiptDialogProps) {
	const generatedId = useId().replace(/:/g, '');
	const titleId = generatedId + '-title';
	const descriptionId = generatedId + '-description';
	const initialDate = toDateInputValue(new Date());
	const [receiptTitle, setReceiptTitle] = useState('');
	const [receivedDate, setReceivedDate] = useState(initialDate);
	const [description, setDescription] = useState('');
	const [drafts, setDrafts] = useState<ProductDraft[]>(() => [
		createProductDraft(initialDate),
	]);
	const [formError, setFormError] = useState<string | null>(null);
	const [showDateErrors, setShowDateErrors] = useState(false);
	const todayInputDate = toDateInputValue(new Date());
	const receivedDateError = !receivedDate
		? 'Enter a received date.'
		: !isValidDateInput(receivedDate)
			? 'Enter a valid date using a four-digit year.'
			: receivedDate > todayInputDate
				? 'Received date cannot be in the future.'
				: null;

	const updateProduct = <K extends keyof ProductDraft>(
		key: string,
		field: K,
		value: ProductDraft[K],
	) => {
		setFormError(null);
		setDrafts((currentDrafts) =>
			currentDrafts.map((draft) =>
				draft.key === key ? { ...draft, [field]: value } : draft,
			),
		);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		setShowDateErrors(true);

		if (
			!receiptTitle.trim() ||
			drafts.some(
				(draft) =>
					!draft.title.trim() ||
					!draft.serialNumber.trim() ||
					!draft.type.trim() ||
					!draft.specification.trim(),
			)
		) {
			setFormError('Complete all required fields before saving the receipt.');
			return;
		}

		const receivedAt = toStoredDate(receivedDate);
		const warrantyDates: { start: string; end: string }[] = [];
		for (const draft of drafts) {
			const start = toStoredDate(draft.guaranteeStart);
			const end = toStoredDate(draft.guaranteeEnd);
			if (!start || !end) {
				setFormError(
					'Enter a valid received date and valid warranty dates for every product.',
				);
				return;
			}
			warrantyDates.push({ start, end });
		}
		if (!receivedAt) {
			setFormError('Enter a valid received date.');
			return;
		}
		if (receivedDate > todayInputDate) {
			setFormError('Received date cannot be in the future.');
			return;
		}
		if (drafts.some((draft) => draft.guaranteeStart > receivedDate)) {
			setFormError('Warranty cannot start after the received date.');
			return;
		}

		const serialNumbers = drafts.map((draft) =>
			draft.serialNumber.trim().toLocaleLowerCase(),
		);
		const savedSerialNumbers = new Set(
			existingSerialNumbers.map((serialNumber) =>
				serialNumber.trim().toLocaleLowerCase(),
			),
		);
		const hasDuplicateSerial = serialNumbers.some(
			(serialNumber, index) =>
				serialNumbers.indexOf(serialNumber) !== index ||
				savedSerialNumbers.has(serialNumber),
		);

		if (hasDuplicateSerial) {
			setFormError(
				'Each serial number must be unique and not already in the inventory.',
			);
			return;
		}

		if (drafts.some((draft) => draft.guaranteeEnd < draft.guaranteeStart)) {
			setFormError(
				'A warranty end date cannot be earlier than its start date.',
			);
			return;
		}

		if (drafts.some((draft) => calculateUahPrice(draft.priceUsd) === null)) {
			setFormError(
				'Enter a USD price up to $222,222,222.22 with no more than 2 decimal places.',
			);
			return;
		}

		const receiptId = createRecordId('RCT');
		const newProducts: Product[] = drafts.map((draft, index) => ({
			id: createRecordId('PRD'),
			serialNumber: draft.serialNumber.trim(),
			title: draft.title.trim(),
			type: draft.type.trim(),
			specification: draft.specification.trim(),
			isNew: draft.isNew === 'new',
			status: draft.status,
			guarantee: warrantyDates[index],
			prices: [
				{ currency: 'USD', value: parseUsdPrice(draft.priceUsd) ?? 0 },
				{ currency: 'UAH', value: calculateUahPrice(draft.priceUsd) ?? 0 },
			],
			receiptId,
		}));
		const receipt: Receipt = {
			id: receiptId,
			title: receiptTitle.trim(),
			receivedAt,
			description: description.trim(),
			productIds: newProducts.map((product) => product.id),
		};

		onCreate(receipt, newProducts);
	};

	return (
		<DialogOverlay onClose={onClose}>
			<section
				className='receipt-form'
				role='dialog'
				aria-modal='true'
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
			>
				<header className='receipt-form__header'>
					<div className='receipt-form__eyebrow'>
						<span className='eyebrow__dot' />
						INCOMING STOCK
					</div>
					<button
						className='icon-button receipt-form__close'
						type='button'
						aria-label='Close new receipt form'
						onClick={onClose}
					>
						<X size={16} />
					</button>
					<h2 id={titleId}>New receipt</h2>
					<p id={descriptionId}>
						Record products received into inventory. Demo changes are saved in
						this browser only.
					</p>
				</header>

				<form className='receipt-form__form' onSubmit={handleSubmit}>
					<div className='receipt-form__body'>
						{(formError || error) && (
							<p className='receipt-form__error' role='alert'>
								{formError ?? error}
							</p>
						)}

						<section
							className='receipt-form__section'
							aria-labelledby={generatedId + '-details'}
						>
							<div className='receipt-form__section-heading'>
								<h3 id={generatedId + '-details'}>Receipt details</h3>
								<span>Required fields are marked *</span>
							</div>
							<div className='receipt-form__fields receipt-form__fields--details'>
								<label className='receipt-form__field receipt-form__field--wide'>
									<span>
										Receipt name <span aria-hidden='true'>*</span>
									</span>
									<input
										autoFocus
										data-autofocus
										name='receiptTitle'
										autoComplete='off'
										maxLength={180}
										placeholder='e.g. Spring office delivery'
										value={receiptTitle}
										onChange={(event) => {
											setReceiptTitle(event.target.value);
											setFormError(null);
										}}
										required
									/>
								</label>
								<label className='receipt-form__field'>
									<span>
										Received date <span aria-hidden='true'>*</span>
									</span>
									<input
										name='receivedDate'
										type='date'
										max={todayInputDate}
										aria-invalid={showDateErrors && Boolean(receivedDateError)}
										aria-describedby={
											showDateErrors && receivedDateError
												? generatedId + '-received-date-error'
												: undefined
										}
										value={receivedDate}
										onInvalid={() => setShowDateErrors(true)}
										onChange={(event) => {
											setReceivedDate(event.target.value);
											setFormError(null);
										}}
										required
									/>
									{showDateErrors && receivedDateError && (
										<small
											className='receipt-form__field-error'
											id={generatedId + '-received-date-error'}
											aria-live='polite'
										>
											{receivedDateError}
										</small>
									)}
								</label>
								<label className='receipt-form__field receipt-form__field--wide'>
									<span>Description</span>
									<textarea
										name='description'
										maxLength={500}
										placeholder='Optional note about this receipt'
										rows={2}
										value={description}
										onChange={(event) => {
											setDescription(event.target.value);
											setFormError(null);
										}}
									/>
								</label>
							</div>
						</section>

						<section
							className='receipt-form__section'
							aria-labelledby={generatedId + '-products'}
						>
							<div className='receipt-form__section-heading'>
								<div>
									<h3 id={generatedId + '-products'}>Products</h3>
									<p>Add one row for each individual item and serial number.</p>
								</div>
								<button
									className='text-button receipt-form__add-product'
									type='button'
									onClick={() =>
										setDrafts((current) => [
											...current,
											createProductDraft(receivedDate),
										])
									}
								>
									<Plus size={14} /> Add product
								</button>
							</div>

							<div className='receipt-form__product-list'>
								{drafts.map((draft, index) => {
									const fieldId = (field: string) =>
										generatedId + '-' + draft.key + '-' + field;
									const uahPrice = calculateUahPrice(draft.priceUsd);
									const priceUsdError = getUsdPriceError(draft.priceUsd);
									const warrantyStartError = !draft.guaranteeStart
										? 'Enter a warranty start date.'
										: !isValidDateInput(draft.guaranteeStart)
											? 'Enter a valid date using a four-digit year.'
											: isValidDateInput(receivedDate) &&
												  draft.guaranteeStart > receivedDate
												? 'Warranty cannot start after the received date.'
												: null;
									const warrantyEndError = !draft.guaranteeEnd
										? 'Enter a warranty end date.'
										: !isValidDateInput(draft.guaranteeEnd)
											? 'Enter a valid date using a four-digit year.'
											: isValidDateInput(draft.guaranteeStart) &&
												  draft.guaranteeEnd < draft.guaranteeStart
												? 'Warranty end must be on or after its start date.'
												: null;
									return (
										<fieldset className='receipt-form__product' key={draft.key}>
											<legend>Product {index + 1}</legend>
											<button
												className='icon-button receipt-form__remove-product'
												type='button'
												aria-label={'Remove product ' + (index + 1)}
												disabled={drafts.length === 1}
												onClick={() =>
													setDrafts((current) =>
														current.filter((item) => item.key !== draft.key),
													)
												}
											>
												<Trash2 size={14} />
											</button>
											<div className='receipt-form__fields'>
												<label
													className='receipt-form__field receipt-form__field--wide'
													htmlFor={fieldId('title')}
												>
													<span>
														Product name <span aria-hidden='true'>*</span>
													</span>
													<input
														id={fieldId('title')}
														value={draft.title}
														maxLength={180}
														onChange={(event) =>
															updateProduct(
																draft.key,
																'title',
																event.target.value,
															)
														}
														required
													/>
												</label>
												<label
													className='receipt-form__field'
													htmlFor={fieldId('serial')}
												>
													<span>
														Serial number <span aria-hidden='true'>*</span>
													</span>
													<input
														id={fieldId('serial')}
														value={draft.serialNumber}
														maxLength={64}
														autoComplete='off'
														onChange={(event) =>
															updateProduct(
																draft.key,
																'serialNumber',
																event.target.value,
															)
														}
														required
													/>
												</label>
												<label
													className='receipt-form__field'
													htmlFor={fieldId('type')}
												>
													<span>
														Type <span aria-hidden='true'>*</span>
													</span>
													<div className='receipt-form__select-wrap'>
														<select
															id={fieldId('type')}
															value={draft.type}
															onChange={(event) =>
																updateProduct(
																	draft.key,
																	'type',
																	event.target.value,
																)
															}
															required
														>
															<option value='' disabled>
																Select a type
															</option>
															{productTypes.map((type) => (
																<option key={type} value={type}>
																	{type}
																</option>
															))}
														</select>
														<ChevronDown
															size={14}
															className='receipt-form__select-chevron'
															aria-hidden='true'
														/>
													</div>
												</label>
												<label
													className='receipt-form__field receipt-form__field--wide'
													htmlFor={fieldId('specification')}
												>
													<span>
														Specification <span aria-hidden='true'>*</span>
													</span>
													<input
														id={fieldId('specification')}
														value={draft.specification}
														maxLength={255}
														placeholder='e.g. 27 in · 4K UHD · USB-C'
														onChange={(event) =>
															updateProduct(
																draft.key,
																'specification',
																event.target.value,
															)
														}
														required
													/>
												</label>
												<label
													className='receipt-form__field'
													htmlFor={fieldId('condition')}
												>
													<span>Condition</span>
													<div className='receipt-form__select-wrap'>
														<select
															id={fieldId('condition')}
															value={draft.isNew}
															onChange={(event) =>
																updateProduct(
																	draft.key,
																	'isNew',
																	event.target.value as ProductDraft['isNew'],
																)
															}
														>
															<option value='new'>New</option>
															<option value='pre-owned'>Pre-owned</option>
														</select>
														<ChevronDown
															size={14}
															className='receipt-form__select-chevron'
															aria-hidden='true'
														/>
													</div>
												</label>
												<label
													className='receipt-form__field'
													htmlFor={fieldId('status')}
												>
													<span>Status</span>
													<div className='receipt-form__select-wrap'>
														<select
															id={fieldId('status')}
															value={draft.status}
															onChange={(event) =>
																updateProduct(
																	draft.key,
																	'status',
																	event.target.value as Product['status'],
																)
															}
														>
															<option value='Available'>Available</option>
															<option value='In repair'>In repair</option>
														</select>
														<ChevronDown
															size={14}
															className='receipt-form__select-chevron'
															aria-hidden='true'
														/>
													</div>
												</label>
												<label
													className='receipt-form__field'
													htmlFor={fieldId('guaranteeStart')}
												>
													<span>
														Warranty starts <span aria-hidden='true'>*</span>
													</span>
													<input
														id={fieldId('guaranteeStart')}
														type='date'
														max={
															isValidDateInput(receivedDate)
																? receivedDate
																: todayInputDate
														}
														aria-invalid={
															showDateErrors && Boolean(warrantyStartError)
														}
														aria-describedby={
															showDateErrors && warrantyStartError
																? fieldId('guaranteeStart-error')
																: undefined
														}
														value={draft.guaranteeStart}
														onInvalid={() => setShowDateErrors(true)}
														onChange={(event) =>
															updateProduct(
																draft.key,
																'guaranteeStart',
																event.target.value,
															)
														}
														required
													/>
													{showDateErrors && warrantyStartError && (
														<small
															className='receipt-form__field-error'
															id={fieldId('guaranteeStart-error')}
															aria-live='polite'
														>
															{warrantyStartError}
														</small>
													)}
												</label>
												<label
													className='receipt-form__field'
													htmlFor={fieldId('guaranteeEnd')}
												>
													<span>
														Warranty ends <span aria-hidden='true'>*</span>
													</span>
													<input
														id={fieldId('guaranteeEnd')}
														type='date'
														min={draft.guaranteeStart}
														max='9999-12-31'
														aria-invalid={
															showDateErrors && Boolean(warrantyEndError)
														}
														aria-describedby={
															showDateErrors && warrantyEndError
																? fieldId('guaranteeEnd-error')
																: undefined
														}
														value={draft.guaranteeEnd}
														onInvalid={() => setShowDateErrors(true)}
														onChange={(event) =>
															updateProduct(
																draft.key,
																'guaranteeEnd',
																event.target.value,
															)
														}
														required
													/>
													{showDateErrors && warrantyEndError && (
														<small
															className='receipt-form__field-error'
															id={fieldId('guaranteeEnd-error')}
															aria-live='polite'
														>
															{warrantyEndError}
														</small>
													)}
												</label>
												<label
													className='receipt-form__field'
													htmlFor={fieldId('priceUsd')}
												>
													<span>
														Price (USD) <span aria-hidden='true'>*</span>
													</span>
													<input
														id={fieldId('priceUsd')}
														type='number'
														min='0'
														max={MAX_USD_PRICE}
														inputMode='decimal'
														aria-invalid={Boolean(priceUsdError)}
														aria-describedby={
															priceUsdError
																? fieldId('priceUsd-error')
																: undefined
														}
														value={draft.priceUsd}
														onChange={(event) =>
															updateProduct(
																draft.key,
																'priceUsd',
																event.target.value,
															)
														}
														required
													/>
													{priceUsdError && (
														<small
															className='receipt-form__field-error'
															id={fieldId('priceUsd-error')}
														>
															{priceUsdError}
														</small>
													)}
												</label>
												<div className='receipt-form__field receipt-form__field--computed'>
													<span id={fieldId('priceUah-label')}>
														Price (UAH)
													</span>
													<output
														className='receipt-form__output'
														aria-labelledby={fieldId('priceUah-label')}
														aria-live='polite'
													>
														{!draft.priceUsd.trim()
															? 'Enter USD price'
															: priceUsdError || uahPrice === null
																? 'Invalid USD price'
																: formatUahPrice(uahPrice)}
													</output>
													<small className='receipt-form__hint'>
														Fixed demo rate: 1 USD = {USD_TO_UAH_RATE} UAH
													</small>
												</div>
											</div>
										</fieldset>
									);
								})}
							</div>
						</section>
					</div>

					<footer className='receipt-form__actions'>
						<button
							className='button button--quiet'
							type='button'
							onClick={onClose}
						>
							Cancel
						</button>
						<button className='button button--primary' type='submit'>
							<Plus size={15} /> Create receipt
						</button>
					</footer>
				</form>
			</section>
		</DialogOverlay>
	);
}
