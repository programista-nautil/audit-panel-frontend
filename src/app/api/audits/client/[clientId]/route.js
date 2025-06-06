import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
	const { clientId } = params
	console.log(clientId)

	if (!clientId) {
		return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
	}

	try {
		const audits = await prisma.audit.findMany({
			where: { clientId: clientId },
			include: {
				reports: {
					orderBy: { createdAt: 'desc' },
					take: 1,
				},
				errors: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		})
		return NextResponse.json(audits)
	} catch (error) {
		console.error('Failed to fetch client audits:', error)
		return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 })
	}
}
