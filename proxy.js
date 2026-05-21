import { NextResponse } from 'next/server';

export async function proxy(request) {
  // Disabling restrictions completely for development so you can access your pages!
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/vault-login'],
};