'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useEffect, useState, useCallback } from 'react'
import { Plus, ChevronDown, ChevronUp, Send, Trash2, X, LoaderCircle, FileText, FileUp } from 'lucide-react'

// Współdzielony komponent Modala (ten sam co na stronie klientów)
function Modal({ children, onClose }) {
	return (
		<div className='fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4'>
			<div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative'>
				<button
					onClick={onClose}
					className='absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors'>
					<X size={24} />
				</button>
				{children}
			</div>
		</div>
	)
}

// Komponent formularza dodawania raportu (przeniesiony dla czytelności)
function AddReportForm({ auditId, onSuccess, onCancel }) {
	const [title, setTitle] = useState('')
	const [version, setVersion] = useState('')
	const [fileUrl, setFileUrl] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async e => {
		e.preventDefault()
		setIsSubmitting(true)
		const res = await fetch('/api/reports', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title, version, fileUrl, auditId }),
		})
		setIsSubmitting(false)
		if (res.ok) {
			onSuccess()
		} else {
			alert('Błąd dodawania raportu')
		}
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<h3 className='text-2xl font-bold mb-6'>Dodaj nowy raport</h3>
			<div>
				<label className='block text-sm font-medium text-gray-700 mb-1'>Tytuł raportu</label>
				<input
					type='text'
					value={title}
					onChange={e => setTitle(e.target.value)}
					required
					className='w-full p-2 border border-gray-300 rounded-md'
				/>
			</div>
			<div>
				<label className='block text-sm font-medium text-gray-700 mb-1'>Wersja (np. 1.0)</label>
				<input
					type='text'
					value={version}
					onChange={e => setVersion(e.target.value)}
					required
					className='w-full p-2 border border-gray-300 rounded-md'
				/>
			</div>
			<div>
				<label className='block text-sm font-medium text-gray-700 mb-1'>Link do pliku</label>
				<input
					type='url'
					value={fileUrl}
					onChange={e => setFileUrl(e.target.value)}
					required
					className='w-full p-2 border border-gray-300 rounded-md'
				/>
			</div>
			<div className='flex justify-end gap-4 pt-4'>
				<button
					type='button'
					onClick={onCancel}
					className='px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold'>
					Anuluj
				</button>
				<button
					type='submit'
					disabled={isSubmitting}
					className='px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold'>
					{isSubmitting && <LoaderCircle className='animate-spin' size={16} />}
					Dodaj
				</button>
			</div>
		</form>
	)
}

export default function AdminAuditsPage({ session }) {
	const [audits, setAudits] = useState([])
	const [clients, setClients] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	// Stan dla formularza dodawania audytu
	const [newAudit, setNewAudit] = useState({ title: '', url: '', clientId: '' })

	// Stan dla rozwijanych wierszy i ich zawartości (raportów)
	const [expandedRow, setExpandedRow] = useState(null)
	const [auditReports, setAuditReports] = useState({})
	const [isLoadingReports, setIsLoadingReports] = useState(false)

	// Stan dla modali
	const [isAddAuditModalOpen, setIsAddAuditModalOpen] = useState(false)
	const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false)
	const [isDeleteAuditModalOpen, setIsDeleteAuditModalOpen] = useState(false)
	const [itemToDelete, setItemToDelete] = useState(null)
	const [selectedAuditId, setSelectedAuditId] = useState(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isDeleteReportModalOpen, setIsDeleteReportModalOpen] = useState(false)
	const [reportToDelete, setReportToDelete] = useState(null)

	// Logika pobierania danych (bez zmian)
	const fetchAuditsAndClients = useCallback(async () => {
		setIsLoading(true)
		try {
			const [auditsRes, clientsRes] = await Promise.all([fetch('/api/audits'), fetch('/api/clients')])
			if (!auditsRes.ok || !clientsRes.ok) throw new Error('Nie udało się pobrać danych.')
			const auditsData = await auditsRes.json()
			const clientsData = await clientsRes.json()
			setAudits(auditsData)
			setClients(clientsData)
		} catch (err) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchAuditsAndClients()
	}, [fetchAuditsAndClients])

	const fetchReportsForAudit = useCallback(async auditId => {
		setIsLoadingReports(true)
		try {
			const res = await fetch(`/api/reports/audit/${auditId}`)
			if (!res.ok) throw new Error('Błąd pobierania raportów')
			const data = await res.json()
			setAuditReports(prev => ({ ...prev, [auditId]: data }))
		} catch (err) {
			console.error('Błąd pobierania raportów:', err)
		} finally {
			setIsLoadingReports(false)
		}
	}, [])

	// Logika dodawania audytu (bez zmian, tylko UI w modalu)
	const handleAddAudit = async e => {
		e.preventDefault()
		setIsSubmitting(true)
		setError('')
		const res = await fetch('/api/audits', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newAudit),
		})
		setIsSubmitting(false)
		if (res.ok) {
			setIsAddAuditModalOpen(false)
			setNewAudit({ title: '', url: '', clientId: '' })
			fetchAuditsAndClients()
		} else {
			alert('Błąd dodawania audytu') // Można to zastąpić setError()
		}
	}

	// Logika usuwania audytu (bez zmian, tylko UI w modalu)
	const handleDeleteAudit = async () => {
		if (!itemToDelete) return
		setIsSubmitting(true)
		const res = await fetch(`/api/audits/${itemToDelete.id}`, { method: 'DELETE' })
		setIsSubmitting(false)
		if (res.ok) {
			setAudits(prev => prev.filter(a => a.id !== itemToDelete.id))
			setIsDeleteAuditModalOpen(false)
			setItemToDelete(null)
		} else {
			alert('Nie udało się usunąć audytu')
		}
	}

	// Logika rozwijania wiersza i pobierania raportów
	const toggleReports = auditId => {
		const isNowExpanded = expandedRow !== auditId
		setExpandedRow(isNowExpanded ? auditId : null)

		if (isNowExpanded && !auditReports[auditId]) {
			fetchReportsForAudit(auditId)
		}
	}

	// Otwiera modal i zapisuje, który raport chcemy usunąć
	const openDeleteReportModal = report => {
		setReportToDelete(report)
		setIsDeleteReportModalOpen(true)
	}

	// Logika usuwania wywoływana przez przycisk w modalu
	const handleDeleteReport = async () => {
		if (!reportToDelete) return

		setIsSubmitting(true)
		const res = await fetch(`/api/reports/${reportToDelete.id}`, { method: 'DELETE' })
		setIsSubmitting(false)

		if (res.ok) {
			// Odświeżenie listy raportów po usunięciu
			const updatedReports = auditReports[reportToDelete.auditId].filter(r => r.id !== reportToDelete.id)
			setAuditReports(prev => ({ ...prev, [reportToDelete.auditId]: updatedReports }))
			setIsDeleteReportModalOpen(false) // Zamknij modal
			setReportToDelete(null) // Wyczyść stan
		} else {
			alert('Nie udało się usunąć raportu') // Można zamienić na setError()
		}
	}

	return (
		<PanelLayout session={session}>
			{/* Nagłówek strony */}
			<div className='flex justify-between items-center mb-8'>
				<div>
					<h2 className='text-3xl font-bold text-gray-800'>Zarządzanie audytami</h2>
					<p className='text-gray-500 mt-1'>Twórz audyty, przypisuj je do klientów i zarządzaj raportami.</p>
				</div>
				<button
					onClick={() => setIsAddAuditModalOpen(true)}
					className='flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all shadow-md'>
					<Plus size={18} /> Dodaj audyt
				</button>
			</div>

			{/* Tabela z audytami */}
			<div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto'>
				{isLoading ? (
					<div className='flex justify-center items-center h-64'>
						<LoaderCircle className='w-8 h-8 animate-spin text-red-600' />
					</div>
				) : (
					<table className='w-full text-sm text-left text-gray-500'>
						<thead className='text-xs text-gray-700 uppercase bg-gray-50'>
							<tr>
								<th scope='col' className='p-4'></th>
								<th scope='col' className='px-6 py-3'>
									Tytuł Audytu
								</th>
								<th scope='col' className='px-6 py-3'>
									Klient
								</th>
								<th scope='col' className='px-6 py-3'>
									Status
								</th>
								<th scope='col' className='px-6 py-3'>
									Data utworzenia
								</th>
								<th scope='col' className='px-6 py-3 text-right'>
									Akcje
								</th>
							</tr>
						</thead>
						<tbody className='text-sm'>
							{audits.map(audit => (
								<>
									<tr key={audit.id} className='bg-white border-b hover:bg-gray-50/70'>
										<td className='px-4 py-2'>
											<button
												onClick={() => toggleReports(audit.id)}
												className='p-2 rounded-full hover:bg-gray-200 transition-colors'>
												<ChevronDown
													size={20}
													className={`transition-transform duration-300 ${
														expandedRow === audit.id ? 'rotate-180' : ''
													}`}
												/>
											</button>
										</td>
										<td className='px-6 py-4 font-bold text-gray-900'>{audit.title}</td>
										<td className='px-6 py-4 text-gray-600'>Siema</td>
										<td className='px-6 py-4'>
											<span
												className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
													audit.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
												}`}>
												{audit.status}
											</span>
										</td>
										<td className='px-6 py-4 text-gray-600'>{new Date(audit.createdAt).toLocaleDateString('pl-PL')}</td>
										<td className='px-6 py-4 text-right flex justify-end items-center gap-2'>
											<a
												href={audit.url}
												target='_blank'
												rel='noopener noreferrer'
												className='p-2 text-gray-400 hover:text-green-600'
												title='Otwórz arkusz'>
												<FileUp size={18} />
											</a>
											<button
												onClick={() => {
													setItemToDelete(audit)
													setIsDeleteAuditModalOpen(true)
												}}
												className='p-2 text-gray-400 hover:text-red-600'
												title='Usuń audyt'>
												<Trash2 size={18} />
											</button>
											<button
												onClick={() => {
													setSelectedAuditId(audit.id)
													setIsAddReportModalOpen(true)
												}}
												className='p-2 text-gray-400 hover:text-blue-600'
												title='Dodaj raport'>
												<Send size={18} />
											</button>
										</td>
									</tr>
									{/* Rozwijana sekcja z raportami */}
									{expandedRow === audit.id && (
										<tr className='bg-gray-50'>
											<td colSpan='6' className='p-4'>
												<div className='bg-white rounded-xl border-2 border-gray-100 p-6'>
													<h4 className='text-md font-bold mb-4 text-gray-800'>
														Raporty w ramach audytu: {audit.title}
													</h4>
													{isLoadingReports ? (
														<div className='flex justify-center items-center h-16'>
															<LoaderCircle className='w-6 h-6 animate-spin text-red-600' />
														</div>
													) : auditReports[audit.id]?.length > 0 ? (
														<div className='space-y-3'>
															{auditReports[audit.id].map(report => (
																<div
																	key={report.id}
																	className='flex justify-between items-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all'>
																	<div className='flex items-center gap-4'>
																		<div className='p-3 bg-red-100 rounded-full'>
																			<FileText className='text-red-600' size={20} />
																		</div>
																		<div>
																			<p className='font-bold text-md text-gray-900'>{report.title}</p>
																			<p className='text-sm text-gray-500'>Wersja: {report.version}</p>
																		</div>
																	</div>
																	<div className='flex items-center gap-3'>
																		{report.fileUrl && (
																			<a
																				href={report.fileUrl}
																				target='_blank'
																				rel='noopener noreferrer'
																				className='px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-sm'>
																				Pobierz
																			</a>
																		)}
																		<button
																			onClick={() => openDeleteReportModal(report)}
																			className='p-2 text-gray-500 bg-gray-200 rounded-md hover:bg-red-200 hover:text-red-700'
																			title='Usuń raport'>
																			<Trash2 size={18} />
																		</button>
																	</div>
																</div>
															))}
														</div>
													) : (
														<div className='text-center py-10'>
															<p className='text-gray-500'>Brak raportów dla tego audytu.</p>
														</div>
													)}
												</div>
											</td>
										</tr>
									)}
								</>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Modal dodawania audytu */}
			{isAddAuditModalOpen && (
				<Modal onClose={() => setIsAddAuditModalOpen(false)}>
					<h3 className='text-2xl font-bold mb-6'>Stwórz nowy audyt</h3>
					<form onSubmit={handleAddAudit} className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>Tytuł audytu</label>
							<input
								type='text'
								value={newAudit.title}
								onChange={e => setNewAudit({ ...newAudit, title: e.target.value })}
								required
								className='w-full p-2 border border-gray-300 rounded-md'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>Link do generatora (opcjonalnie)</label>
							<input
								type='url'
								value={newAudit.url}
								onChange={e => setNewAudit({ ...newAudit, url: e.target.value })}
								className='w-full p-2 border border-gray-300 rounded-md'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>Przypisz do klienta</label>
							<select
								value={newAudit.clientId}
								onChange={e => setNewAudit({ ...newAudit, clientId: e.target.value })}
								required
								className='w-full p-2 border border-gray-300 rounded-md'>
								<option value='' disabled>
									-- Wybierz klienta --
								</option>
								{clients.map(c => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div className='flex justify-end gap-4 pt-4'>
							<button
								type='button'
								onClick={() => setIsAddAuditModalOpen(false)}
								className='px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold'>
								Anuluj
							</button>
							<button
								type='submit'
								disabled={isSubmitting}
								className='px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold'>
								{isSubmitting && <LoaderCircle className='animate-spin' size={16} />}
								Stwórz audyt
							</button>
						</div>
					</form>
				</Modal>
			)}

			{/* Modal dodawania raportu */}
			{isAddReportModalOpen && (
				<Modal onClose={() => setIsAddReportModalOpen(false)}>
					<AddReportForm
						auditId={selectedAuditId}
						onSuccess={() => {
							setIsAddReportModalOpen(false)
							setExpandedRow(selectedAuditId)
							fetchReportsForAudit(selectedAuditId)
						}}
						onCancel={() => setIsAddReportModalOpen(false)}
					/>
				</Modal>
			)}

			{/* Modal potwierdzenia usunięcia audytu */}
			{isDeleteAuditModalOpen && (
				<Modal onClose={() => setIsDeleteAuditModalOpen(false)}>
					<h3 className='text-2xl font-bold mb-4'>Potwierdź usunięcie</h3>
					<p className='text-gray-600 mb-6'>
						Czy na pewno chcesz usunąć audyt <span className='font-bold'>{itemToDelete?.title}</span> i wszystkie jego
						raporty? Operacja jest nieodwracalna.
					</p>
					<div className='flex justify-end gap-4'>
						<button
							onClick={() => setIsDeleteAuditModalOpen(false)}
							className='px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold'>
							Anuluj
						</button>
						<button
							onClick={handleDeleteAudit}
							disabled={isSubmitting}
							className='px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold'>
							{isSubmitting && <LoaderCircle className='animate-spin' size={16} />}
							Tak, usuń
						</button>
					</div>
				</Modal>
			)}

			{isDeleteReportModalOpen && (
				<Modal onClose={() => setIsDeleteReportModalOpen(false)}>
					<h3 className='text-2xl font-bold mb-4'>Potwierdź usunięcie</h3>
					<p className='text-gray-600 mb-6'>
						Czy na pewno chcesz usunąć raport: <span className='font-bold'>{reportToDelete?.title}</span>? Tej operacji
						nie można cofnąć.
					</p>
					<div className='flex justify-end gap-4'>
						<button
							onClick={() => setIsDeleteReportModalOpen(false)}
							className='px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold'>
							Anuluj
						</button>
						<button
							onClick={handleDeleteReport}
							disabled={isSubmitting}
							className='px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold'>
							{isSubmitting && <LoaderCircle className='animate-spin' size={16} />}
							Tak, usuń
						</button>
					</div>
				</Modal>
			)}
		</PanelLayout>
	)
}
