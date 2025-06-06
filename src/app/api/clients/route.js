import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET() {
	const clients = await prisma.user.findMany({
		where: { role: 'CLIENT' },
		include: {
			audits: {
				include: {
					reports: true,
				},
			},
		},
	})

	const clientsWithoutPassword = clients.map(client => {
		const { passwordHash, ...clientData } = client
		return clientData
	})

	return NextResponse.json(clientsWithoutPassword)
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
