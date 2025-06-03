import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_, { params }) {
	const { id } = params

	try {
		await prisma.file.deleteMany({ where: { auditId: id } }) // usuń powiązane pliki
		await prisma.audit.delete({ where: { id } })

		return NextResponse.json({ success: true })
	} catch (error) {
		return new NextResponse('Błąd przy usuwaniu audytu', { status: 500 })
	}
}
