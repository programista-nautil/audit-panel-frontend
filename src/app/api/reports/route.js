import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req) {
	try {
		const body = await req.json()
		const { title, version, fileUrl, auditId } = body

		const report = await prisma.report.create({
			data: { title, version, fileUrl, auditId },
		})

		return NextResponse.json(report, { status: 201 })
	} catch (error) {
		console.error('Błąd dodawania raportu:', error)
		return new NextResponse('Błąd serwera', { status: 500 })
	}
}
