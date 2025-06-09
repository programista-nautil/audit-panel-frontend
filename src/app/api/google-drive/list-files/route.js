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

function findSheetInTree(files) {
	for (const file of files) {
		if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
			return file // Znaleziono arkusz
		}
		if (file.children) {
			const foundInChild = findSheetInTree(file.children)
			if (foundInChild) {
				return foundInChild
			}
		}
	}
	return null // Nie znaleziono arkusza
}

function parseVersionFromName(name) {
	const match = name.match(/_v(\d+(\.\d+)?)/)
	// Zwraca znalezioną wersję lub '1.0' jako domyślną
	return match ? match[1] : '1.0'
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

		let auditCreationResult = { success: false, message: 'Nie znaleziono arkusza kalkulacyjnego w folderze.' }

		const sheetFile = findSheetInTree(nestedFiles)

		if (sheetFile) {
			const defaultClient = await prisma.user.findFirst({
				where: { name: 'Klient' },
			})

			if (!defaultClient) {
				auditCreationResult.message = "Błąd: Użytkownik o nazwie 'Klient' nie został znaleziony w bazie danych."
			} else {
				const newAudit = await prisma.audit.create({
					data: {
						title: sheetFile.name, // Tytuł audytu to nazwa pliku arkusza
						url: sheetFile.webViewLink, // Link do audytu to link do arkusza
						status: 'DRAFT',
						clientId: defaultClient.id, // ID domyślnego klienta
						createdById: session.user.id, // ID zalogowanego admina
					},
				})

				let importedReportsCount = 0

				const reportsFolder = nestedFiles.find(
					item => item.name.toLowerCase() === 'raport' && item.mimeType === 'application/vnd.google-apps.folder'
				)

				if (reportsFolder && reportsFolder.children) {
					const reportDocuments = reportsFolder.children.filter(
						doc =>
							doc.mimeType === 'application/vnd.google-apps.document' && doc.name.toLowerCase().startsWith('raport')
					)

					const reportsToCreate = reportDocuments.map(doc => ({
						title: doc.name,
						version: parseVersionFromName(doc.name),
						fileUrl: doc.webViewLink,
						auditId: newAudit.id,
					}))

					if (reportsToCreate.length > 0) {
						const creationResult = await prisma.report.createMany({
							data: reportsToCreate,
						})
						importedReportsCount = creationResult.count
					}
				}

				auditCreationResult = {
					success: true,
					message: `Pomyślnie dodano audyt: "${newAudit.title}"`,
					audit: newAudit,
				}
			}
		}

		return NextResponse.json({
			files: nestedFiles,
			auditCreationResult: auditCreationResult,
		})
	} catch (error) {
		console.error('Błąd API Google Drive:', error.message)
		return NextResponse.json(
			{ error: 'Błąd podczas pobierania plików z Dysku Google.', details: error.message },
			{ status: 500 }
		)
	}
}
