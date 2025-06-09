import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import bcrypt from 'bcrypt'

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

async function streamToString(stream) {
	const chunks = []
	for await (const chunk of stream) {
		chunks.push(Buffer.from(chunk))
	}
	return Buffer.concat(chunks).toString('utf-8')
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

		let auditCreationResult = { success: false, message: 'Nie można przetworzyć audytu.' }
		const sheetFile = findSheetInTree(nestedFiles)

		if (!sheetFile) {
			auditCreationResult.message = 'Nie znaleziono pliku Arkusza Google w folderze.'
			return NextResponse.json({ files: nestedFiles, auditCreationResult })
		}

		let auditRecord
		let auditWasCreated = false
		let clientUser
		let generatedPassword = null
		let finalMessage = ''
		const clientDataFile = nestedFiles.find(f => f.name.toLowerCase() === 'dane_klienta.txt')
		const reportsFolder = nestedFiles.find(
			item => item.name.toLowerCase() === 'raport' && item.mimeType === 'application/vnd.google-apps.folder'
		)

		const existingAudit = await prisma.audit.findUnique({
			where: { url: sheetFile.webViewLink },
		})

		if (existingAudit) {
			auditRecord = existingAudit
			finalMessage = `Audyt "${auditRecord.title}" już istnieje. `
		} else {
			if (!clientDataFile) {
				auditCreationResult.message = "Nie znaleziono pliku 'dane_klienta.txt' w głównym folderze audytu."
				return NextResponse.json({ files: nestedFiles, auditCreationResult })
			}

			// 2. Odczytaj zawartość pliku
			const fileContentStream = await drive.files.get({ fileId: clientDataFile.id, alt: 'media' })
			const fileContent = await streamToString(fileContentStream.data)
			const [clientName, clientEmail] = fileContent.split('\n').map(line => line.trim())

			if (!clientName || !clientEmail) {
				auditCreationResult.message =
					"Plik 'dane_klienta.txt' ma nieprawidłowy format. Oczekiwano dwóch linii: Nazwa i Email."
				return NextResponse.json({ files: nestedFiles, auditCreationResult })
			}

			const existingClient = await prisma.user.findUnique({ where: { email: clientEmail } })

			if (existingClient) {
				clientUser = existingClient
			} else {
				generatedPassword = Math.random().toString(36).slice(-8)
				const hashedPassword = await bcrypt.hash(generatedPassword, 10)

				clientUser = await prisma.user.create({
					data: {
						email: clientEmail,
						name: clientName,
						passwordHash: hashedPassword,
						role: 'CLIENT',
					},
				})
			}
			auditRecord = await prisma.audit.create({
				data: {
					title: sheetFile.name,
					url: sheetFile.webViewLink,
					status: 'DRAFT',
					clientId: clientUser.id,
					createdById: session.user.id,
				},
			})
			auditWasCreated = true

			finalMessage = `Pomyślnie dodano audyt: "${auditRecord.title}". `
			if (generatedPassword) {
				finalMessage += `Utworzono nowe konto dla klienta ${clientUser.name}. Hasło tymczasowe: ${generatedPassword}. `
			}
		}

		let newReportsCount = 0

		if (reportsFolder && reportsFolder.children) {
			const reportDocuments = reportsFolder.children.filter(
				doc => doc.mimeType === 'application/vnd.google-apps.document' && doc.name.toLowerCase().startsWith('raport')
			)

			const existingReports = await prisma.report.findMany({
				where: { auditId: auditRecord.id },
				select: { fileUrl: true },
			})
			const existingReportUrls = new Set(existingReports.map(r => r.fileUrl))

			// Odfiltruj te dokumenty z Dysku, których jeszcze nie ma w bazie
			const newReportDocs = reportDocuments.filter(doc => !existingReportUrls.has(doc.webViewLink))

			if (newReportDocs.length > 0) {
				const reportsToCreate = newReportDocs.map(doc => ({
					title: doc.name,
					version: parseVersionFromName(doc.name),
					fileUrl: doc.webViewLink,
					auditId: auditRecord.id,
				}))
				const creationResult = await prisma.report.createMany({ data: reportsToCreate })
				newReportsCount = creationResult.count
			}
		}

		let newOtherFilesCount = 0
		const excludedIds = new Set()
		if (sheetFile) excludedIds.add(sheetFile.id)
		if (clientDataFile) excludedIds.add(clientDataFile.id)
		if (reportsFolder) excludedIds.add(reportsFolder.id)

		const otherFilesFromDrive = nestedFiles.filter(
			item => !excludedIds.has(item.id) && item.mimeType !== 'application/vnd.google-apps.folder'
		)

		if (otherFilesFromDrive.length > 0) {
			const existingFiles = await prisma.file.findMany({
				where: { auditId: auditRecord.id },
				select: { url: true },
			})
			const existingFileUrls = new Set(existingFiles.map(f => f.url))

			const newFilesToCreate = otherFilesFromDrive.filter(file => !existingFileUrls.has(file.webViewLink))
			if (newFilesToCreate.length > 0) {
				const fileData = newFilesToCreate.map(file => ({
					filename: file.name,
					url: file.webViewLink,
					type: file.mimeType,
					auditId: auditRecord.id,
				}))
				const creationResult = await prisma.file.createMany({ data: fileData })
				newOtherFilesCount = creationResult.count
			}
		}

		finalMessage += `Zsynchronizowano raporty: dodano ${newReportsCount} nowych. Zaimportowano ${newOtherFilesCount} dodatkowych plików.`

		auditCreationResult = {
			success: true,
			message: finalMessage,
			audit: auditRecord,
		}

		return NextResponse.json({ files: nestedFiles, auditCreationResult })
	} catch (error) {
		console.error('Błąd API Google Drive:', error.message)
		return NextResponse.json(
			{ error: 'Błąd podczas pobierania plików z Dysku Google.', details: error.message },
			{ status: 500 }
		)
	}
}
