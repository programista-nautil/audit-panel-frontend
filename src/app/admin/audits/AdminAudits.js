'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AdminAudits({ session }) {
	const [title, setTitle] = useState('')
	const [url, setUrl] = useState('')
	const [audits, setAudits] = useState([])

	const [expandedReports, setExpandedReports] = useState({})
	const [auditReports, setAuditReports] = useState({})

	const [clients, setClients] = useState([])
	const [clientId, setClientId] = useState('')

	const [showModal, setShowModal] = useState(false)
	const [selectedAuditId, setSelectedAuditId] = useState(null)

	const toggleReports = async auditId => {
		setExpandedReports(prev => {
			const isNowExpanded = !prev[auditId]

			if (isNowExpanded && !auditReports[auditId]) {
				fetch(`/api/reports/audit/${auditId}`)
					.then(res => res.json())
					.then(data => {
						setAuditReports(prev => ({ ...prev, [auditId]: data }))
					})
			}
			return { ...prev, [auditId]: isNowExpanded }
		})
	}

	const handleSubmit = async e => {
		e.preventDefault()
		const res = await fetch('/api/audits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title, url, clientId }),
		})
		if (res.ok) {
			setTitle('')
			setUrl('')
			fetchAudits()
		} else {
			alert('Błąd dodawania audytu')
		}
	}

	const fetchAudits = async () => {
		const res = await fetch('/api/audits')
		if (res.ok) {
			const data = await res.json()
			setAudits(data)
		}
	}

	const fetchClients = async () => {
		const res = await fetch('/api/clients')
		if (res.ok) {
			const data = await res.json()
			setClients(data)
		}
		console.log(res)
	}

	useEffect(() => {
		fetchClients()
		fetchAudits()
	}, [])

	return (
		<PanelLayout session={session}>
			<h2 className='text-2xl font-bold text-gray-800 mb-6'>Dodaj nowy audyt</h2>

			<form onSubmit={handleSubmit} className='mb-10 bg-white p-6 rounded shadow w-full max-w-xl'>
				<div className='mb-4'>
					<label className='block font-medium mb-1'>Tytuł audytu</label>
					<input
						type='text'
						value={title}
						onChange={e => setTitle(e.target.value)}
						required
						className='border rounded p-2 w-full'
					/>
				</div>
				<div className='mb-4'>
					<label className='block font-medium mb-1'>Link do generatora (Google Sheets)</label>
					<input
						type='url'
						value={url}
						onChange={e => setUrl(e.target.value)}
						required
						className='border rounded p-2 w-full'
					/>
				</div>
				<div className='mb-4'>
					<label className='block font-medium mb-1'>Przypisz do klienta</label>
					<select
						value={clientId}
						onChange={e => setClientId(e.target.value)}
						required
						className='border rounded p-2 w-full'>
						<option value=''>-- Wybierz klienta --</option>
						{clients.map(client => (
							<option key={client.id} value={client.id}>
								{client.name || client.email}
							</option>
						))}
					</select>
				</div>
				<button type='submit' className='bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800'>
					Dodaj audyt
				</button>
			</form>

			<h3 className='text-xl font-semibold text-gray-800 mb-4'>Wszystkie audyty</h3>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start'>
				{audits
					.filter(a => a.url)
					.map(audit => (
						<div key={audit.id} className='bg-white border border-gray-200 rounded-lg shadow p-5 flex flex-col'>
							{/* Górny rząd: tytuł + link po lewej, przyciski po prawej */}
							<div className='flex justify-between items-start mb-4'>
								<div>
									<h4 className='text-lg font-semibold text-gray-800 mb-2'>{audit.title}</h4>
									<a
										href={audit.url}
										target='_blank'
										rel='noopener noreferrer'
										className='inline-block text-center px-4 py-2 text-sm font-medium text-white bg-red-700 rounded hover:bg-red-800 transition'>
										Otwórz arkusz
									</a>
								</div>

								<div className='flex items-center gap-2'>
									{/* Rozwiń */}
									<div className='relative group'>
										<button className='cursor-pointer' onClick={() => toggleReports(audit.id)}>
											{expandedReports[audit.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
										</button>
										<div className='absolute bottom-full mb-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition transform bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50'>
											Rozwiń/Schowaj
										</div>
									</div>

									{/* Usuń */}
									<button
										onClick={async () => {
											const confirmDelete = confirm('Czy na pewno chcesz usunąć ten audyt?')
											if (!confirmDelete) return

											const res = await fetch(`/api/audits/${audit.id}`, { method: 'DELETE' })

											if (res.ok) {
												setAudits(prev => prev.filter(a => a.id !== audit.id))
											} else {
												alert('Nie udało się usunąć audytu')
											}
										}}
										className='text-gray-400 hover:text-red-700 transition cursor-pointer'
										title='Usuń audyt'>
										<Trash2 size={18} />
									</button>

									{/* Dodaj raport */}
									<div className='relative group'>
										<Button
											variant='red'
											className='text-red-700 hover:text-red-800 p-1 cursor-pointer'
											onClick={() => {
												setSelectedAuditId(audit.id)
												setShowModal(true)
											}}
											aria-label='Dodaj raport'>
											<Send size={20} />
										</Button>
										<div className='absolute bottom-full mb-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition transform bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50'>
											Dodaj raport
										</div>
									</div>
								</div>
							</div>

							{/* Raporty */}
							{expandedReports[audit.id] && (
								<div className='mt-2 border-t pt-2'>
									{auditReports[audit.id]?.length > 0 ? (
										<ul className='text-sm space-y-1 mb-4'>
											{auditReports[audit.id].map(report => (
												<li key={report.id} className='flex justify-between items-center'>
													<div>
														<span className='font-medium'>{report.title}</span>{' '}
														<span className='text-gray-500'>v{report.version}</span>
													</div>
													<div className='flex items-center gap-2'>
														{report.fileUrl && (
															<a
																href={report.fileUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='text-xs text-blue-600 underline'>
																Plik
															</a>
														)}
														<button
															onClick={async () => {
																const confirmDelete = confirm('Czy na pewno chcesz usunąć ten raport?')
																if (!confirmDelete) return

																const res = await fetch(`/api/reports/${report.id}`, { method: 'DELETE' })

																if (res.ok) {
																	setAuditReports(prev => ({
																		...prev,
																		[audit.id]: prev[audit.id].filter(r => r.id !== report.id),
																	}))
																} else {
																	alert('Nie udało się usunąć raportu')
																}
															}}
															className='text-xs text-red-600 hover:text-red-800 cursor-pointer'>
															Usuń
														</button>
													</div>
												</li>
											))}
										</ul>
									) : (
										<p className='text-gray-500 text-sm mb-4'>Brak raportów</p>
									)}
								</div>
							)}
						</div>
					))}
				{showModal && (
					<div className='fixed inset-0 bg-black/50 flex justify-center items-center z-50'>
						<div className='bg-white p-6 rounded shadow w-full max-w-md'>
							<h4 className='text-lg font-semibold mb-4'>Dodaj raport</h4>
							<AddReportForm
								auditId={selectedAuditId}
								onSuccess={() => {
									setShowModal(false)
									toggleReports(selectedAuditId) // odśwież raporty
								}}
								onCancel={() => setShowModal(false)}
							/>
						</div>
					</div>
				)}
			</div>
		</PanelLayout>
	)
}

function AddReportForm({ auditId, onSuccess, onCancel }) {
	const [title, setTitle] = useState('')
	const [version, setVersion] = useState('')
	const [fileUrl, setFileUrl] = useState('')
	const [loading, setLoading] = useState(false)

	const handleAdd = async e => {
		e.preventDefault()
		setLoading(true)

		const res = await fetch('/api/reports', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title, version, fileUrl, auditId }),
		})

		setLoading(false)

		if (res.ok) {
			setTitle('')
			setVersion('')
			setFileUrl('')
			onSuccess()
		} else {
			alert('Błąd dodawania raportu')
		}
	}

	return (
		<form onSubmit={handleAdd} className='space-y-2 text-sm'>
			<input
				type='text'
				value={title}
				onChange={e => setTitle(e.target.value)}
				placeholder='Tytuł raportu'
				required
				className='border rounded px-2 py-1 w-full'
			/>
			<input
				type='text'
				value={version}
				onChange={e => setVersion(e.target.value)}
				placeholder='Wersja'
				required
				className='border rounded px-2 py-1 w-full'
			/>
			<input
				type='url'
				value={fileUrl}
				onChange={e => setFileUrl(e.target.value)}
				placeholder='Link do pliku'
				required
				className='border rounded px-2 py-1 w-full'
			/>
			<div className='flex justify-end gap-2 mt-4'>
				<button
					type='button'
					onClick={onCancel}
					className='bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400'>
					Anuluj
				</button>
				<button
					type='submit'
					disabled={loading}
					className='bg-red-700 text-white px-3 py-1 rounded hover:bg-red-800 disabled:opacity-50'>
					Dodaj
				</button>
			</div>
		</form>
	)
}
