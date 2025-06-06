import PanelLayout from '@/components/layout/PanelLayout'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, Download, Calendar, FolderClock } from 'lucide-react'

// Funkcja pobierania danych po stronie serwera
async function getReportsData(session) {
	if (!session?.user?.id) {
		return []
	}
	try {
		const auditsWithReports = await prisma.audit.findMany({
			where: { clientId: session.user.id },
			// Dołączamy wszystkie raporty do każdego audytu
			include: {
				reports: {
					orderBy: { createdAt: 'desc' },
				},
			},
			orderBy: { createdAt: 'desc' },
		})
		// Zwracamy tylko te audyty, które faktycznie mają jakieś raporty
		return auditsWithReports.filter(audit => audit.reports.length > 0)
	} catch (error) {
		console.error('Błąd pobierania raportów klienta:', error)
		return [] // Zwróć pustą tablicę w razie błędu
	}
}

// Główny komponent strony (teraz serwerowy)
export default async function ClientReportsPage() {
	const session = await getServerSession(authOptions)
	if (!session) {
		return redirect('/login')
	}

	const audits = await getReportsData(session)

	return (
		<PanelLayout>
			<div className='space-y-8'>
				{/* Nagłówek strony */}
				<div>
					<h2 className='text-3xl font-bold text-gray-800'>Twoje raporty</h2>
					<p className='text-gray-500 mt-1'>Przeglądaj i pobieraj wszystkie raporty z Twoich audytów.</p>
				</div>

				{/* Lista audytów z raportami */}
				{audits.length > 0 ? (
					<div className='space-y-10'>
						{audits.map(audit => (
							<div key={audit.id}>
								{/* Nagłówek audytu */}
								<div className='flex items-center gap-3 mb-4 pb-2 border-b-2 border-gray-200'>
									<FolderClock className='w-6 h-6 text-red-600' />
									<h3 className='text-2xl font-semibold text-gray-700'>{audit.title}</h3>
								</div>

								{/* Lista raportów dla danego audytu */}
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
									{audit.reports.map(report => (
										<div
											key={report.id}
											className='bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-between hover:border-red-300 hover:shadow-xl transition-all'>
											<div className='flex items-start gap-4 mb-4'>
												<div className='p-3 bg-red-100 rounded-full'>
													<FileText className='text-red-600' size={24} />
												</div>
												<div>
													<p className='font-bold text-lg text-gray-900'>{report.title}</p>
													<p className='text-sm text-gray-500'>Wersja {report.version}</p>
												</div>
											</div>
											<div className='text-xs text-gray-400 flex items-center gap-2 mb-5'>
												<Calendar size={14} />
												<span>Opublikowano: {new Date(report.createdAt).toLocaleDateString('pl-PL')}</span>
											</div>
											<a
												href={report.fileUrl}
												target='_blank'
												rel='noopener noreferrer'
												className='w-full flex items-center justify-center gap-2 text-center py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm'>
												<Download size={16} />
												Pobierz raport
											</a>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100'>
						<FileText className='mx-auto h-12 w-12 text-gray-300' />
						<h3 className='mt-2 text-lg font-medium text-gray-900'>Brak dostępnych raportów</h3>
						<p className='mt-1 text-sm text-gray-500'>
							Gdy tylko przygotujemy dla Ciebie nowe raporty, znajdziesz je tutaj.
						</p>
					</div>
				)}
			</div>
		</PanelLayout>
	)
}
