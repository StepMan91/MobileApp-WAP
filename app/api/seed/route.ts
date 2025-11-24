import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const email = 'user@example.com';
        const password = 'userpass';
        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password_hash: hashedPassword,
            },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
