import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request) {
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) {
		return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
	}

	try {
		const { currentPassword, newPassword } = await request.json()

		if (!currentPassword || !newPassword) {
			return NextResponse.json({ error: 'Wszystkie pola są wymagane' }, { status: 400 })
		}

		if (newPassword.length < 6) {
			return NextResponse.json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków' }, { status: 400 })
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
		})

		if (!user) {
			return NextResponse.json({ error: 'Nie znaleziono użytkownika' }, { status: 404 })
		}

		const isPasswordCorrect = await bcrypt.compare(currentPassword, user.passwordHash)

		if (!isPasswordCorrect) {
			return NextResponse.json({ error: 'Obecne hasło jest nieprawidłowe' }, { status: 403 })
		}

		const newHashedPassword = await bcrypt.hash(newPassword, 10)

		await prisma.user.update({
			where: { id: session.user.id },
			data: { passwordHash: newHashedPassword },
		})

		return NextResponse.json({ message: 'Hasło zostało pomyślnie zmienione' })
	} catch (error) {
		console.error('Błąd podczas zmiany hasła:', error)
		return NextResponse.json({ error: 'Wystąpił nieoczekiwany błąd serwera' }, { status: 500 })
	}
}
