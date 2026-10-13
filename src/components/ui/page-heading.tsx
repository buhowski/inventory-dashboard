import type { ReactNode } from 'react';

type PageHeadingProps = {
	eyebrow: string;
	title: string;
	count: number;
	description: string;
	action?: ReactNode;
	className?: string;
};

// Render reusable page headings.
export function PageHeading({
	eyebrow,
	title,
	count,
	description,
	action,
	className,
}: PageHeadingProps) {
	const headingClassName = ['page__heading', className].filter(Boolean).join(' ');

	return (
		<div className={headingClassName}>
			<div>
				<div className='eyebrow'>
					<span className='eyebrow__dot' aria-hidden='true' />
					{eyebrow}
				</div>
				<h1>
					{title} <span className='page__count'>{count}</span>
				</h1>
				<p className='page__description'>{description}</p>
			</div>
			{action}
		</div>
	);
}
