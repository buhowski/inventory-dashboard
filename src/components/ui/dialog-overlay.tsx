import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

const focusableSelector =
	'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DialogOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
	const overlayRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const overlay = overlayRef.current;
		if (!overlay) return;

		const previouslyFocused =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const focusableElements = overlay.querySelectorAll<HTMLElement>(focusableSelector);
		const preferredFocus = overlay.querySelector<HTMLElement>('[data-autofocus]');
		(preferredFocus ?? focusableElements[0] ?? overlay).focus();

		return () => {
			if (previouslyFocused?.isConnected) previouslyFocused.focus();
		};
	}, []);

	const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget) onClose();
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
			return;
		}

		if (event.key !== 'Tab') return;

		const focusableElements = overlayRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
		if (!focusableElements?.length) {
			event.preventDefault();
			overlayRef.current?.focus();
			return;
		}

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (event.shiftKey && document.activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
		} else if (!event.shiftKey && document.activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
		} else if (!overlayRef.current?.contains(document.activeElement)) {
			event.preventDefault();
			firstElement.focus();
		}
	};

	return (
		<div className='dialog-wrapper'>
			<div
				ref={overlayRef}
				className='dialog-overlay'
				tabIndex={-1}
				onMouseDown={handleMouseDown}
				onKeyDown={handleKeyDown}
			>
				<div>{children}</div>
			</div>
		</div>
	);
}
