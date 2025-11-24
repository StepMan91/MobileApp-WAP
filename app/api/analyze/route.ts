import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const image = formData.get('image') as File;
        const comment = formData.get('comment') as string;
        const rating = formData.get('rating') as string;

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await image.arrayBuffer());
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Mock AI Analysis
        const aiResponse = `AI Analysis: This appears to be a photo with rating ${rating}. The user commented: "${comment}". Interesting composition!`;

        // Save to DB
        const analysis = await prisma.analysis.create({
            data: {
                user_id: payload.userId as string,
                image_path: `/uploads/${filename}`,
                comment: comment,
                rating: parseInt(rating),
                ai_response: aiResponse,
            },
        });

        return NextResponse.json({ success: true, ai_response: aiResponse, analysis });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
