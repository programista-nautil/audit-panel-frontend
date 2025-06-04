'use client'

import { useEffect, useState } from 'react'
import PanelLayout from '@/components/layout/PanelLayout'

export default function ClientReports() {
	const [reports, setReports] = useState([])

	useEffect(() => {
		const fetchReports = async () => {
			const resAudits = await fetch('/api/audits/client')
			const audits = await resAudits.json()

			const allReports = await Promise.all(
				audits.map(async audit => {
					const resReports = await fetch(`/api/reports/audit/${audit.id}`)
					const reports = await resReports.json()
					return reports.map(r => ({ ...r, auditTitle: audit.title }))
				})
			)

			setReports(allReports.flat())
		}

		fetchReports()
	}, [])

	return (
		<PanelLayout>
			<div className='max-w-4xl mx-auto p-6'>
				<h2 className='text-2xl font-bold mb-4'>Twoje raporty</h2>
				{reports.length > 0 ? (
					<ul className='space-y-3'>
						{reports.map(report => (
							<li
								key={report.id}
								className='p-4 bg-white rounded shadow border border-gray-200 flex justify-between items-center'>
								<div>
									<p className='font-semibold'>
										{report.title} <span className='text-gray-500'>v{report.version}</span>
									</p>
								</div>
								<a
									href={report.fileUrl}
									target='_blank'
									rel='noopener noreferrer'
									className='text-blue-600 hover:underline text-sm'>
									Pobierz
								</a>
							</li>
						))}
					</ul>
				) : (
					<p className='text-gray-500'>Brak dostępnych raportów.</p>
				)}
			</div>
		</PanelLayout>
	)
}
