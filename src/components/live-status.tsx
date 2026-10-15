'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Clock3, Zap } from '@/components/icons';

export function LiveStatus() {
	const [now, setNow] = useState<Date | null>(null);
	const [activeTabs, setActiveTabs] = useState<number | null>(null);

	useEffect(() => {
		const updateTime = () => setNow(new Date());
		updateTime();
		const timer = window.setInterval(updateTime, 1000);

		const socketUrl =
			process.env.NEXT_PUBLIC_SOCKET_URL ??
			`${window.location.protocol}//${window.location.hostname}:3001`;
		const socket: Socket = io(socketUrl, { transports: ['websocket', 'polling'] });
		socket.on('active-count', (count: number) => setActiveTabs(count));
		socket.on('connect_error', (error) => {
			console.error('Unable to connect to live presence.', error.message);
			setActiveTabs(null);
		});

		return () => {
			window.clearInterval(timer);
			socket.disconnect();
		};
	}, []);

	return (
		<div className='live-status'>
			<div className='live-status__clock'>
				<span className='live-status__date'>
					{now
						? new Intl.DateTimeFormat('en-GB', {
								weekday: 'short',
								month: 'short',
								day: 'numeric',
								year: 'numeric',
							}).format(now)
						: 'Loading date'}
				</span>

				<span className='live-status__time'>
					<Clock3 size={14} />
					{now
						? new Intl.DateTimeFormat('en-GB', {
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
							}).format(now)
						: '--:--:--'}
				</span>
			</div>

			<div className='presence' title='Connected browser tabs'>
				<span
					className={`presence__light${activeTabs === null ? ' presence__light--offline' : ''}`}
				/>

				<Zap size={14} />

				<span>{activeTabs === null ? 'Offline' : `${activeTabs} active`}</span>
			</div>
		</div>
	);
}
