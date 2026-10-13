import type { ReactNode } from 'react';

type MetricCardProps = {
	icon: ReactNode;
	tone: 'green' | 'blue' | 'purple';
	label: string;
	value: string;
	note: string;
	noteTone: 'trend' | 'caption';
};

// Render reusable metric cards.
export function MetricCard({ icon, tone, label, value, note, noteTone }: MetricCardProps) {
	return (
		<div className='overview__card'>
			<span className={`overview__icon overview__icon--${tone}`}>{icon}</span>
			<div>
				<span className='overview__label'>{label}</span>
				<strong>{value}</strong>
			</div>
			<span className={`overview__${noteTone}`}>{note}</span>
		</div>
	);
}
