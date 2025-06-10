import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req, props) {
	const params = await props.params
	try {
		const { auditId } = params

		const reports = await prisma.report.findMany({
			where: { auditId },
			orderBy: { createdAt: 'desc' },
		})

		return NextResponse.json(reports)
	} catch (error) {
		console.error('Błąd przy pobieraniu raportów:', error)
		return new NextResponse('Błąd serwera', { status: 500 })
	}
}
