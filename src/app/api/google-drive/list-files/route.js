import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

async function getFolderContentsRecursive(drive, folderId) {
	const response = await drive.files.list({
		q: `'${folderId}' in parents and trashed = false`,
		fields: 'files(id, name, mimeType, webViewLink)',
		orderBy: 'folder,name',
	})

	const files = response.data.files || []

	// Dla każdego elementu na liście, jeśli jest folderem, pobierz jego zawartość
	for (let i = 0; i < files.length; i++) {
		if (files[i].mimeType === 'application/vnd.google-apps.folder') {
			// Wywołujemy tę samą funkcję dla podfolderu
			files[i].children = await getFolderContentsRecursive(drive, files[i].id)
		}
	}

	return files
}

export async function GET(request) {
	const session = await getServerSession(authOptions)

	// Zabezpieczenie: tylko zalogowany admin może korzystać z tego API
	if (!session || session.user.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
	}

	const { searchParams } = new URL(request.url)
	const folderId = searchParams.get('folderId')

	if (!folderId) {
		return NextResponse.json({ error: 'ID folderu jest wymagane' }, { status: 400 })
	}

	try {
		const account = await prisma.account.findFirst({
			where: { userId: session.user.id, provider: 'google' },
		})

		if (!account?.access_token || !account?.refresh_token) {
			throw new Error('Brak tokenów dostępu lub odświeżania.')
		}

		const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

		auth.setCredentials({
			access_token: account.access_token,
			refresh_token: account.refresh_token,
		})

		const drive = google.drive({ version: 'v3', auth })

		const nestedFiles = await getFolderContentsRecursive(drive, folderId)

		return NextResponse.json(nestedFiles)
	} catch (error) {
		console.error('Błąd API Google Drive:', error.message)
		return NextResponse.json(
			{ error: 'Błąd podczas pobierania plików z Dysku Google.', details: error.message },
			{ status: 500 }
		)
	}
}
