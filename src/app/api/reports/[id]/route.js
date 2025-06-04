import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(req, { params }) {
	try {
		const reportId = params.id

		await prisma.report.delete({ where: { id: reportId } })

		return new NextResponse(null, { status: 204 })
	} catch (error) {
		console.error('Błąd usuwania raportu:', error)
		return new NextResponse('Błąd serwera', { status: 500 })
	}
}
