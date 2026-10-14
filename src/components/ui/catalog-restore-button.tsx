import { RotateCcw } from '@/components/icons';

export function CatalogRestoreButton({ onClick }: { onClick: () => void }) {
	return (
		<button className='button button--primary catalog__restore' type='button' onClick={onClick}>
			<RotateCcw size={14} /> Restore demo inventory
		</button>
	);
}
