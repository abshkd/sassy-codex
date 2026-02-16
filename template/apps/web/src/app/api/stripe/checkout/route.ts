import { NextResponse } from 'next/server';
export async function POST() { return NextResponse.json({ checkoutUrl: 'https://checkout.stripe.test/session' }); }
