import type { ReactNode } from 'react';
import { Trash2, X } from '@/components/icons';
import { DialogOverlay } from '@/components/ui/dialog-overlay';

type DeleteConfirmationDialogProps = {
	titleId: string;
	title: string;
	description: ReactNode;
	details: ReactNode;
	error: string | null;
	cancelLabel: string;
	confirmLabel: string;
	onClose: () => void;
	onConfirm: () => void;
};

export function DeleteConfirmationDialog({
	titleId,
	title,
	description,
	details,
	error,
	cancelLabel,
	confirmLabel,
	onClose,
	onConfirm,
}: DeleteConfirmationDialogProps) {
	return (
		<DialogOverlay onClose={onClose}>
			<section
				className='delete-dialog'
				role='alertdialog'
				aria-modal='true'
				aria-labelledby={titleId}
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

				<h2 id={titleId}>{title}</h2>

				<p className='delete-dialog__copy'>{description}</p>

				<div className='delete-dialog__products'>{details}</div>
				{error && (
					<p className='delete-dialog__error' role='alert'>
						{error}
					</p>
				)}
				<div className='delete-dialog__actions'>
					<button className='button button--quiet' type='button' onClick={onClose}>
						{cancelLabel}
					</button>

					<button className='button button--danger' type='button' onClick={onConfirm}>
						<Trash2 size={15} /> {confirmLabel}
					</button>
				</div>
			</section>
		</DialogOverlay>
	);
}
