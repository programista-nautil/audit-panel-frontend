import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'

export async function DELETE(req, props) {
    const params = await props.params;
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
		return new NextResponse('Unauthorized', { status: 401 })
	}

    const { id } = params

    try {
		await prisma.error.deleteMany({ where: { auditId: id } })
		await prisma.file.deleteMany({ where: { auditId: id } })
		await prisma.report.deleteMany({ where: { auditId: id } })
		await prisma.audit.delete({ where: { id } })

		return new NextResponse(null, { status: 204 })
	} catch (error) {
		console.error('Błąd usuwania audytu:', error)
		return new NextResponse('Błąd serwera', { status: 500 })
	}
}
