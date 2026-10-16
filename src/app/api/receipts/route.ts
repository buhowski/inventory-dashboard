import { NextResponse } from 'next/server';
import { receipts } from '@/lib/data';

export function GET() {
	return NextResponse.json(receipts);
}
