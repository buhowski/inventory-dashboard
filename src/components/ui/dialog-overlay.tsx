import type { MouseEvent, ReactNode } from 'react';

export function DialogOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
	const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget) onClose();
	};

	return (
		<div className='dialog-overlay' onMouseDown={handleMouseDown}>
			{children}
		</div>
	);
}
