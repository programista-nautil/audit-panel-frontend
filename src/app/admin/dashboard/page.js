import PanelLayout from '@/components/layout/PanelLayout'
import { withAuth } from '@/lib/withAuth'
import { FilePlus2, UserPlus, ClipboardCheck, Users, Activity, FileText } from 'lucide-react'
import Link from 'next/link'
import { AdminAuditsChart } from './AdminAuditsChart' // Importujemy nowy komponent

// Funkcja do pobierania danych po stronie serwera
async function getDashboardData() {
	try {
		// Używamy pełnego URL, ponieważ fetch działa po stronie serwera
		// W środowisku produkcyjnym należy użyć zmiennej środowiskowej dla domeny
		const domain = process.env.NEXT_PUBLIC_VERCEL_URL
			? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
			: 'http://localhost:3000'

		const auditsRes = await fetch(`${domain}/api/audits`, { cache: 'no-store' })
		const clientsRes = await fetch(`${domain}/api/clients`, { cache: 'no-store' })

		if (!auditsRes.ok || !clientsRes.ok) {
			throw new Error('Failed to fetch data')
		}

		const audits = await auditsRes.json()
		const clients = await clientsRes.json()

		// Przykładowa logika - można ją rozbudować
		const completedAudits = audits.filter(a => a.status === 'COMPLETED').length
		const recentAudits = audits.slice(0, 5) // Ostatnie 5 audytów

		return {
			auditCount: audits.length,
			clientCount: clients.length,
			completedAudits,
			recentAudits,
		}
	} catch (error) {
		console.error('Dashboard data fetching error:', error)
		// Zwracamy domyślne wartości w razie błędu
		return { auditCount: 0, clientCount: 0, completedAudits: 0, recentAudits: [] }
	}
}

// Komponent karty statystyk dla lepszej re-używalności
function StatCard({ icon, title, value, description }) {
	return (
		<div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-start gap-5'>
			<div className='bg-red-100 p-4 rounded-full'>{icon}</div>
			<div>
				<p className='text-sm font-medium text-gray-500'>{title}</p>
				<p className='text-3xl font-bold text-gray-900 mt-1'>{value}</p>
				{description && <p className='text-xs text-gray-400 mt-1'>{description}</p>}
			</div>
		</div>
	)
}

async function AdminDashboard({ session }) {
	const { auditCount, clientCount, completedAudits, recentAudits } = await getDashboardData()

	return (
		<PanelLayout>
			<div className='space-y-8'>
				{/* Nagłówek i Szybkie Akcje */}
				<div className='flex flex-col sm:flex-row justify-between items-start gap-4'>
					<div>
						<h2 className='text-3xl font-bold text-gray-800'>Witaj, {session.user.name}!</h2>
						<p className='text-gray-500 mt-1'>Oto podsumowanie dzisiejszej aktywności.</p>
					</div>
					<div className='flex items-center gap-2'>
						<Link
							href='/admin/audits'
							className='flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all'>
							<FilePlus2 className='w-4 h-4' /> Nowy audyt
						</Link>
						<Link
							href='/admin/clients'
							className='flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-all'>
							<UserPlus className='w-4 h-4' /> Nowy klient
						</Link>
					</div>
				</div>

				{/* Karty ze statystykami */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					<StatCard
						icon={<FileText className='w-7 h-7 text-red-600' />}
						title='Wszystkie audyty'
						value={auditCount}
						description='Łączna liczba audytów w systemie'
					/>
					<StatCard
						icon={<Users className='w-7 h-7 text-red-600' />}
						title='Aktywni klienci'
						value={clientCount}
						description='Liczba klientów z aktywnymi audytami'
					/>
					<StatCard
						icon={<ClipboardCheck className='w-7 h-7 text-red-600' />}
						title='Zakończone audyty'
						value={completedAudits}
						description='Audyty, które zostały ukończone'
					/>
				</div>

				{/* Główna sekcja z wykresem i tabelą */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					{/* Wykres - zajmuje 2/3 szerokości na dużych ekranach */}
					<div className='lg:col-span-2'>
						<AdminAuditsChart />
					</div>

					{/* Ostatnie audyty - zajmuje 1/3 */}
					<div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100'>
						<h3 className='text-lg font-semibold text-gray-800 mb-4'>Ostatnia aktywność</h3>
						<ul className='space-y-4'>
							{recentAudits.length > 0 ? (
								recentAudits.map(audit => (
									<li key={audit.id} className='flex items-center gap-4'>
										<div className='bg-gray-100 p-3 rounded-full'>
											<Activity className='w-5 h-5 text-gray-500' />
										</div>
										<div>
											<p className='font-semibold text-sm text-gray-800'>{audit.name}</p>
											<p className='text-xs text-gray-500'>
												Status: <span className='font-medium text-red-600'>{audit.status}</span>
											</p>
										</div>
									</li>
								))
							) : (
								<p className='text-sm text-gray-500'>Brak ostatnich audytów do wyświetlenia.</p>
							)}
						</ul>
					</div>
				</div>
			</div>
		</PanelLayout>
	)
}

export const dynamic = 'force-dynamic'
export default withAuth({ role: 'ADMIN' })(AdminDashboard)
