import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'ADMIN') {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	const body = await req.json()
	const { title, url } = body

	if (!title || !url) {
		return new NextResponse('Missing fields', { status: 400 })
	}

	const audit = await prisma.audit.create({
		data: {
			title,
			url,
			status: 'DRAFT',
			clientId: session.user.id,
			createdById: session.user.id,
		},
	})

	return NextResponse.json(audit)
}
