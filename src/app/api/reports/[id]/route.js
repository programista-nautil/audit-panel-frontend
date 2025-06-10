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
    const { id: reportId } = params

    // 1. Sprawdź, czy użytkownik to zalogowany admin
    if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
	}

    try {
		// 2. Znajdź w naszej bazie raport, który chcemy usunąć, aby poznać jego URL
		const reportInDb = await prisma.report.findUnique({
			where: { id: reportId },
		})

		if (!reportInDb) {
			return NextResponse.json({ error: 'Raport nie został znaleziony' }, { status: 404 })
		}

		// 3. Połącz się z API Google, używając tokenów admina
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

		// 4. Wyciągnij ID pliku z URL-a i usuń plik z Dysku Google
		const googleFileId = getGoogleFileIdFromUrl(reportInDb.fileUrl)

		if (googleFileId) {
			try {
				await drive.files.delete({ fileId: googleFileId })
				console.log(`Pomyślnie usunięto plik z Dysku Google: ${googleFileId}`)
			} catch (driveError) {
				// Jeśli plik już nie istnieje na Dysku, zaloguj błąd, ale kontynuuj
				console.error(
					`Nie udało się usunąć pliku z Dysku Google (ID: ${googleFileId}). Może został już usunięty? Błąd:`,
					driveError.message
				)
			}
		}

		// 5. Na koniec, usuń rekord raportu z naszej bazy danych
		await prisma.report.delete({
			where: { id: reportId },
		})

		return NextResponse.json({ message: 'Raport został pomyślnie usunięty z aplikacji i Dysku Google.' })
	} catch (error) {
		console.error('Błąd podczas usuwania raportu:', error)
		return NextResponse.json({ error: 'Wystąpił nieoczekiwany błąd serwera' }, { status: 500 })
	}
}
