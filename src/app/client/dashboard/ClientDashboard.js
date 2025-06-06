import PanelLayout from '@/components/layout/PanelLayout'
import { withAuth } from '@/lib/withAuth'
import { FileText, Bug, CheckCircle, Download, ListChecks } from 'lucide-react'
import { AuditStatusChart } from './AuditStatusChart'

// Funkcja do pobierania i przetwarzania danych po stronie serwera
async function getClientDashboardData(session) {
	try {
		const domain = process.env.NEXT_PUBLIC_VERCEL_URL
			? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
			: 'http://localhost:3000'
		const res = await fetch(`${domain}/api/audits/client/${session.user.id}`, { cache: 'no-store' })

		if (!res.ok) throw new Error('Failed to fetch data')

		const audits = await res.json()

		// Przetwarzanie danych do statystyk i list
		const totalAudits = audits.length
		const unresolvedErrors = audits.reduce((sum, audit) => {
			const unresolvedInAudit = audit.errors?.filter(e => !e.isResolved).length || 0
			return sum + unresolvedInAudit
		}, 0)
		const completedAudits = audits.filter(a => a.status === 'COMPLETED').length

		const auditStatusCounts = audits.reduce((acc, audit) => {
			acc[audit.status] = (acc[audit.status] || 0) + 1
			return acc
		}, {})

		const recentReports = audits
			.filter(audit => audit.reports && audit.reports.length > 0)
			.map(audit => ({ ...audit.reports[0], auditTitle: audit.title }))
			.slice(0, 4) // Weź 4 najnowsze

		return { totalAudits, unresolvedErrors, completedAudits, auditStatusCounts, recentReports }
	} catch (error) {
		console.error('Client dashboard data fetching error:', error)
		return { totalAudits: 0, unresolvedErrors: 0, completedAudits: 0, auditStatusCounts: {}, recentReports: [] }
	}
}

// Komponent karty statystyk
function StatCard({ icon, title, value, color }) {
	const colorClasses = {
		red: 'bg-red-100 text-red-600',
		orange: 'bg-orange-100 text-orange-600',
		green: 'bg-green-100 text-green-600',
	}
	return (
		<div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-start gap-5'>
			<div className={`p-4 rounded-full ${colorClasses[color]}`}>{icon}</div>
			<div>
				<p className='text-sm font-medium text-gray-500'>{title}</p>
				<p className='text-3xl font-bold text-gray-900 mt-1'>{value}</p>
			</div>
		</div>
	)
}

// Główny komponent pulpitu
export default async function ClientDashboard({ session }) {
	const { totalAudits, unresolvedErrors, completedAudits, auditStatusCounts, recentReports } =
		await getClientDashboardData(session)

	return (
		<PanelLayout>
			<div className='space-y-8'>
				{/* Nagłówek */}
				<div>
					<h2 className='text-3xl font-bold text-gray-800'>Witaj, {session.user.name}!</h2>
					<p className='text-gray-500 mt-1'>Oto podsumowanie Twoich audytów i raportów.</p>
				</div>

				{/* Karty ze statystykami */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					<StatCard
						icon={<ListChecks className='w-7 h-7' />}
						title='Wszystkie audyty'
						value={totalAudits}
						color='red'
					/>
					<StatCard
						icon={<Bug className='w-7 h-7' />}
						title='Błędy do poprawy'
						value={unresolvedErrors}
						color='orange'
					/>
					<StatCard
						icon={<CheckCircle className='w-7 h-7' />}
						title='Ukończone audyty'
						value={completedAudits}
						color='green'
					/>
				</div>

				{/* Sekcja z wykresem i najnowszymi raportami */}
				<div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
					{/* Wykres */}
					<div className='lg:col-span-3'>
						<AuditStatusChart data={auditStatusCounts} />
					</div>

					{/* Najnowsze raporty */}
					<div className='lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100'>
						<h3 className='text-lg font-semibold text-gray-800 mb-4'>Najnowsze raporty</h3>
						<div className='space-y-4'>
							{recentReports.length > 0 ? (
								recentReports.map(report => (
									<div
										key={report.id}
										className='flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-red-50 transition-colors'>
										<div>
											<p className='font-semibold text-sm text-gray-800'>{report.auditTitle}</p>
											<p className='text-xs text-gray-500'>
												Raport: {report.title} (v{report.version})
											</p>
										</div>
										<a
											href={report.fileUrl}
											target='_blank'
											rel='noopener noreferrer'
											className='p-2 text-red-600 bg-red-100 rounded-md hover:bg-red-200'
											title='Pobierz raport'>
											<Download size={20} />
										</a>
									</div>
								))
							) : (
								<p className='text-sm text-center text-gray-500 py-8'>Brak dostępnych raportów.</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</PanelLayout>
	)
}
