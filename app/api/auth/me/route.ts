
if (!payload) {
    return NextResponse.json({ user: null });
}

const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { id: true, email: true },
});

return NextResponse.json({ user });
}
