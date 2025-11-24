import Camera from '@/components/Camera';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';

export default async function Home() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        redirect('/login');
    }

    const payload = await verifyToken(token);
    if (!payload) {
        redirect('/login');
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-100">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-2xl font-bold mb-4 text-center w-full">AI Analysis Camera</h1>
            </div>

            <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
                <Camera />
            </div>

            <div className="mt-8 text-center text-gray-500 text-xs">
                <p>Logged in as {payload.email as string}</p>
                <form action="/api/auth/logout" method="POST">
                    <button type="submit" className="underline text-blue-500">Logout</button>
                </form>
            </div>
        </main>
    );
}
