import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(request, props) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    const { auditId } = params

    if (!session) {
		return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
	}

    try {
		const files = await prisma.file.findMany({
			where: { auditId: auditId },
			orderBy: { filename: 'asc' },
		})
		return NextResponse.json(files)
	} catch (error) {
		console.error('Błąd podczas pobierania plików dla audytu:', error)
		return NextResponse.json({ error: 'Nie udało się pobrać plików' }, { status: 500 })
	}
}
