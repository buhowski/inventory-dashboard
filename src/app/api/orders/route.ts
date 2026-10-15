import { NextResponse } from 'next/server';
import { orders } from '@/lib/data';

export function GET() {
	return NextResponse.json(orders);
}
