'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/lib/store';
import { Search, X } from '@/components/icons';
import { setSearchQuery } from '@/lib/store';

// Search records visible on each page.
export function SearchBar() {
	const dispatch = useDispatch<AppDispatch>();
	const query = useSelector((state: RootState) => state.inventory.searchQuery);
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus search from the keyboard.
	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				inputRef.current?.focus();
			}
		};

		window.addEventListener('keydown', handleShortcut);
		return () => window.removeEventListener('keydown', handleShortcut);
	}, []);

	return (
		<label className='search'>
			<Search size={17} aria-hidden='true' />

			<input
				ref={inputRef}
				type='search'
				value={query}
				onChange={(event) => dispatch(setSearchQuery(event.target.value))}
				placeholder='Search inventory...'
				aria-label='Search inventory'
			/>
			{query ? (
				<button
					className='search__clear'
					type='button'
					aria-label='Clear search'
					onClick={() => dispatch(setSearchQuery(''))}
				>
					<X size={15} />
				</button>
			) : (
				<kbd className='search__shortcut'>⌘ K</kbd>
			)}
		</label>
	);
}
