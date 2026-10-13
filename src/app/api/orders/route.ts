import { NextResponse } from 'next/server';
import { orders } from '@/lib/data';

// Serve receipt records to the client.
export function GET() {
	return NextResponse.json(orders);
}
