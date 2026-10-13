import { NextResponse } from 'next/server';
import { products } from '@/lib/data';

// Serve product records to the client.
export function GET() {
	return NextResponse.json(products);
}
