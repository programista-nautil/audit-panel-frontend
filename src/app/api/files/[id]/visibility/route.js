import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function PATCH(request, props) {
	const params = await props.params
	const session = await getServerSession(authOptions)
	const { id: fileId } = params

	if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
	}

	try {
		const { isVisible } = await request.json()

		if (typeof isVisible !== 'boolean') {
			return NextResponse.json({ error: 'Nieprawidłowa wartość dla pola isVisible' }, { status: 400 })
		}

		const updatedFile = await prisma.file.update({
			where: { id: fileId },
			data: { isVisibleToClient: isVisible },
		})

		return NextResponse.json(updatedFile)
	} catch (error) {
		console.error('Błąd podczas zmiany widoczności pliku:', error)
		return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 })
	}
}
