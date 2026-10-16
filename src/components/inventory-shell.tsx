'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Package, Settings, ShieldCheck, ShoppingBag } from '@/components/icons';
import { LiveStatus } from '@/components/live-status';
import { SearchBar } from '@/components/search-bar';

const navigation = [
	{ href: '/orders', label: 'Orders', icon: ShoppingBag },
	{ href: '/products', label: 'Products', icon: Package },
];

export function InventoryShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	return (
		<div className='app'>
			<header className='topbar'>
				<Link className='brand' href='/orders' aria-label='Stockroom home'>
					<span className='brand__mark'>
						<ShieldCheck size={19} strokeWidth={2.3} />
					</span>

					<span className='brand__word'>STOCKROOM</span>
				</Link>

				<SearchBar />

				<LiveStatus />
			</header>

			<aside className='sidebar'>
				<div className='profile'>
					<div className='profile__avatar' aria-hidden='true'>
						🧠
					</div>

					<span className='profile__indicator' aria-label='Profile online' />

					<span className='profile__name'>Dr. Gonzo</span>

					<span className='profile__role'>Master of Coin</span>
				</div>

				<p className='nav__label'>WORKSPACE</p>

				<nav className='nav' aria-label='Main navigation'>
					{navigation.map(({ href, label, icon: Icon }) => (
						<Link
							className={`nav__item${pathname === href ? ' nav__item--active' : ''}`}
							href={href}
							aria-current={pathname === href ? 'page' : undefined}
							key={href}
						>
							<Icon size={17} />

							<span>{label}</span>
							{pathname === href && <span className='nav__active-dot' />}
						</Link>
					))}
				</nav>

				<div className='sidebar__bottom'>
					<div className='workspace'>
						<div className='workspace__icon'>⟁</div>

						<div className='workspace__copy'>
							<span>Workspace</span>

							<strong>Hello World</strong>
						</div>
					</div>
				</div>
			</aside>

			<main className='app__main'>
				<div className='app__mobile-brand'>
					<Link className='brand' href='/orders'>
						<span className='brand__mark'>
							<ShieldCheck size={18} />
						</span>

						<span className='brand__word'>STOCKROOM</span>
					</Link>

					<span>
						<ShoppingBag size={16} /> Inventory
					</span>
				</div>
				{children}
			</main>
		</div>
	);
}
