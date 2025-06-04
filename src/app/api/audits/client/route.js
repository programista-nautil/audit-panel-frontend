import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
	const session = await getServerSession(authOptions)

	if (!session || session.user.role !== 'CLIENT') {
		return new NextResponse('Unauthorized', { status: 401 })
	}

	try {
		const audits = await prisma.audit.findMany({
			where: { clientId: session.user.id },
			select: {
				id: true,
				title: true,
				reports: {
					select: {
						id: true,
						title: true,
						version: true,
						fileUrl: true,
						createdAt: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		})

		return NextResponse.json(audits)
	} catch (err) {
		console.error(err)
		return new NextResponse('Server error', { status: 500 })
	}
}
