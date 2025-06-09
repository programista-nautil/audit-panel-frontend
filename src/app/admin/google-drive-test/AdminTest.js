import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import PanelLayout from '@/components/layout/PanelLayout'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { File } from 'lucide-react'

async function getDriveFiles(session) {
	if (!session?.user?.id) {
		throw new Error('Brak sesji użytkownika.')
	}

	// 1. Znajdź konto Google powiązane z zalogowanym użytkownikiem
	const account = await prisma.account.findFirst({
		where: {
			userId: session.user.id,
			provider: 'google',
		},
	})

	console.log(account)

	if (!account?.access_token || !account?.refresh_token) {
		throw new Error('Nie znaleziono tokenów dostępu lub odświeżania dla konta Google. Spróbuj zalogować się ponownie.')
	}

	// 2. Skonfiguruj klienta API Google z tokenem dostępu
	const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
	auth.setCredentials({
		access_token: account.access_token,
		refresh_token: account.refresh_token,
	})

	// 3. Połącz się z API Dysku Google
	const drive = google.drive({ version: 'v3', auth })

	// 4. Pobierz listę 10 plików
	try {
		const response = await drive.files.list({
			pageSize: 10,
			fields: 'files(id, name, webViewLink)',
			orderBy: 'createdTime desc',
		})
		return response.data.files || []
	} catch (error) {
		console.error('Błąd API Google Drive:', error)
		// Tutaj może być potrzebne odświeżenie tokenu, ale na razie obsłużmy błąd
		throw new Error('Nie udało się pobrać plików z Dysku Google. Token mógł wygasnąć.')
	}
}

export default async function AdminTest() {
	const session = await getServerSession(authOptions)
	if (!session || session.user.role !== 'ADMIN') {
		redirect('/login')
	}

	let files = []
	let error = null

	try {
		files = await getDriveFiles(session)
	} catch (e) {
		error = e.message
	}

	return (
		<PanelLayout>
			<div className='space-y-6'>
				<div>
					<h2 className='text-3xl font-bold text-gray-800'>Test Połączenia z Dyskiem Google</h2>
					<p className='text-gray-500 mt-1'>
						Ta strona próbuje pobrać 10 ostatnich plików z Twojego Dysku, aby zweryfikować połączenie.
					</p>
				</div>

				<div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100'>
					{error ? (
						<div className='text-red-600 bg-red-50 p-4 rounded-lg'>
							<h3 className='font-bold'>Wystąpił błąd:</h3>
							<p>{error}</p>
						</div>
					) : (
						<div>
							<h3 className='text-lg font-semibold text-gray-800 mb-4'>Pomyślnie pobrano listę plików:</h3>
							{files.length > 0 ? (
								<ul className='space-y-2'>
									{files.map(file => (
										<li key={file.id} className='flex items-center gap-3 p-3 bg-gray-50 rounded-md'>
											<File className='text-gray-500' />
											<a
												href={file.webViewLink}
												target='_blank'
												rel='noopener noreferrer'
												className='font-medium text-gray-700 hover:text-red-600'>
												{file.name}
											</a>
										</li>
									))}
								</ul>
							) : (
								<p className='text-gray-500'>Nie znaleziono żadnych plików na Twoim Dysku.</p>
							)}
						</div>
					)}
				</div>
			</div>
		</PanelLayout>
	)
}
