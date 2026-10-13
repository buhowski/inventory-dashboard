import { redirect } from 'next/navigation';

// Open the default inventory view.
export default function HomePage() {
	redirect('/orders');
}
