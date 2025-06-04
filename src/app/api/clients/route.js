import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET() {
	const clients = await prisma.user.findMany({
		where: { role: 'CLIENT' },
		select: { id: true, email: true, name: true },
	})
	return NextResponse.json(clients)
}

export async function POST(req) {
	const { email, password, name } = await req.json()

	const existing = await prisma.user.findUnique({ where: { email } })
	if (existing) {
		return new NextResponse('Użytkownik już istnieje', { status: 400 })
	}

	const hashedPassword = await bcrypt.hash(password, 10)
	const user = await prisma.user.create({
		data: {
			email,
			passwordHash: hashedPassword,
			role: 'CLIENT',
			name,
		},
	})

	return NextResponse.json({ id: user.id, email: user.email, role: user.role })
}
