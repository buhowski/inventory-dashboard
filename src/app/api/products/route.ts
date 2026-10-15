import { NextResponse } from 'next/server';
import { products } from '@/lib/data';

export function GET() {
	return NextResponse.json(products);
}
