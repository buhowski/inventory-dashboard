import type { ReactNode } from 'react';

// Animate navigation between pages.
export default function PageTransition({ children }: { children: ReactNode }) {
	return <div className='page-transition'>{children}</div>;
}
