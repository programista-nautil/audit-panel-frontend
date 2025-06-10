import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

// Funkcja pomocnicza do wyciągania ID pliku z URL-a Google Drive
function getGoogleFileIdFromUrl(url) {
	const match = url.match(/d\/(.*?)(?:\/|\?|$)/)
	return match ? match[1] : null
}

export async function DELETE(request, props) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    const { id: fileId } = params

    if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
	}

    try {
		const fileInDb = await prisma.file.findUnique({
			where: { id: fileId },
		})

		if (!fileInDb) {
			return NextResponse.json({ error: 'Plik nie został znaleziony' }, { status: 404 })
		}

		// Połącz się z API Google
		const account = await prisma.account.findFirst({
			where: { userId: session.user.id, provider: 'google' },
		})

		if (!account?.access_token || !account?.refresh_token) {
			throw new Error('Konto admina nie jest połączone z Google lub brakuje tokenów.')
		}

		const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
		auth.setCredentials({
			access_token: account.access_token,
			refresh_token: account.refresh_token,
		})
		const drive = google.drive({ version: 'v3', auth })

		// Usuń plik z Dysku Google
		const googleFileId = getGoogleFileIdFromUrl(fileInDb.url)
		if (googleFileId) {
			try {
				await drive.files.delete({ fileId: googleFileId })
				console.log(`Pomyślnie usunięto plik z Dysku Google: ${googleFileId}`)
			} catch (driveError) {
				console.error(`Nie udało się usunąć pliku z Dysku Google (ID: ${googleFileId}). Błąd:`, driveError.message)
			}
		}

		// Usuń rekord z naszej bazy danych
		await prisma.file.delete({
			where: { id: fileId },
		})

		return NextResponse.json({ message: 'Plik został pomyślnie usunięty.' })
	} catch (error) {
		console.error('Błąd podczas usuwania pliku:', error)
		return NextResponse.json({ error: 'Wystąpił nieoczekiwany błąd serwera' }, { status: 500 })
	}
}
