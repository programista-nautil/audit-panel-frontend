import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function PATCH(request, props) {
	const params = await props.params
	const session = await getServerSession(authOptions)
	const { id: reportId } = params

	if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
	}

	try {
		const { isVisible } = await request.json()

		if (typeof isVisible !== 'boolean') {
			return NextResponse.json({ error: 'Nieprawidłowa wartość dla pola isVisible' }, { status: 400 })
		}

		const updatedReport = await prisma.report.update({
			where: { id: reportId },
			data: { isVisibleToClient: isVisible },
		})

		return NextResponse.json(updatedReport)
	} catch (error) {
		console.error('Błąd podczas zmiany widoczności raportu:', error)
		return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 })
	}
}
