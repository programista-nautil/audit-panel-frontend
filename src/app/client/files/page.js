import PanelLayout from '@/components/layout/PanelLayout'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Paperclip, Download, Calendar, FolderClock } from 'lucide-react'

// Funkcja do pobierania audytów z dołączonymi plikami (bez zmian)
async function getFilesData(session) {
	if (!session?.user?.id) {
		return []
	}
	try {
		const auditsWithFiles = await prisma.audit.findMany({
			where: { clientId: session.user.id },
			include: {
				files: {
					where: { isVisibleToClient: true },
					orderBy: { filename: 'asc' },
				},
			},
			orderBy: { createdAt: 'desc' },
		})
		return auditsWithFiles.filter(audit => audit.files.length > 0)
	} catch (error) {
		console.error('Błąd pobierania dodatkowych plików klienta:', error)
		return []
	}
}

// === NOWA FUNKCJA POMOCNICZA DO TWORZENIA "ŁADNYCH" ETYKIET ===
const mapMimeTypeToLabel = mimeType => {
	const mapping = {
		'application/pdf': 'Dokument PDF',
		'image/jpeg': 'Obraz JPG',
		'image/png': 'Obraz PNG',
		'image/gif': 'Obraz GIF',
		'application/zip': 'Archiwum ZIP',
		'text/plain': 'Plik tekstowy',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Dokument Word',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Arkusz Excel',
	}
	return mapping[mimeType] || 'Inny plik'
}

// Główny komponent strony
export default async function ClientFilesPage() {
	const session = await getServerSession(authOptions)
	if (!session) {
		return redirect('/login')
	}

	const audits = await getFilesData(session)

	return (
		<PanelLayout>
			<div className='space-y-8'>
				{/* Nagłówek strony */}
				<div>
					<h2 className='text-3xl font-bold text-gray-800'>Dodatkowe pliki</h2>
					<p className='text-gray-500 mt-1'>Przeglądaj i pobieraj wszystkie pliki powiązane z Twoimi audytami.</p>
				</div>

				{/* Lista audytów z plikami */}
				{audits.length > 0 ? (
					<div className='space-y-10'>
						{audits.map(audit => (
							<div key={audit.id}>
								{/* Nagłówek audytu */}
								<div className='flex items-center gap-3 mb-4 pb-2 border-b-2 border-gray-200'>
									<FolderClock className='w-6 h-6 text-red-600' />
									<h3 className='text-2xl font-semibold text-gray-700'>{audit.title}</h3>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
									{audit.files.map(file => (
										<div
											key={file.id}
											className='bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-between hover:border-red-300 hover:shadow-xl transition-all'>
											<div className='flex items-start gap-4 mb-4'>
												{/* POPRAWKA 1: Zmiana kolorystyki ikony na czerwoną */}
												<div className='p-3 bg-red-100 rounded-full'>
													<Paperclip className='text-red-600' size={24} />
												</div>
												<div className='min-w-0 flex-1'>
													{/* POPRAWKA 2: Usunięto 'truncate' i dodano 'break-words' dla zawijania tekstu */}
													<p className='font-bold text-lg text-gray-900 break-words' title={file.filename}>
														{file.filename}
													</p>
													{/* POPRAWKA 3: Użycie funkcji do wyświetlania ładnej etykiety */}
													<p className='text-sm text-gray-500'>{mapMimeTypeToLabel(file.type)}</p>
												</div>
											</div>
											<div className='h-5 mb-5'></div>
											<a
												href={file.url}
												target='_blank'
												rel='noopener noreferrer'
												className='w-full flex items-center justify-center gap-2 text-center py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm'>
												<Download size={16} />
												Pobierz plik
											</a>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100'>
						<Paperclip className='mx-auto h-12 w-12 text-gray-300' />
						<h3 className='mt-2 text-lg font-medium text-gray-900'>Brak dodatkowych plików</h3>
						<p className='mt-1 text-sm text-gray-500'>
							Nie dodano jeszcze żadnych dodatkowych materiałów do Twoich audytów.
						</p>
					</div>
				)}
			</div>
		</PanelLayout>
	)
}
