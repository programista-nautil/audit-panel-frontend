'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useEffect, useState, useCallback } from 'react'
import { ChevronDown, Download, Send, Trash2, X, LoaderCircle, FileText, FileUp, Disc3 } from 'lucide-react'
import GoogleDriveImporter from './GoogleDriveImporter'

function VisibilityToggle({ isVisible, onToggle, isLoading }) {
	const label = isVisible ? 'Widoczny' : 'Ukryty'
	return (
		<div className='flex flex-col items-center w-24'>
			<label
				className='flex items-center cursor-pointer'
				title={isVisible ? 'Ukryj przed klientem' : 'Pokaż klientowi'}>
				<div className='relative'>
					<input
						type='checkbox'
						checked={isVisible}
						onChange={onToggle}
						disabled={isLoading}
						className='sr-only peer'
					/>
					<div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
				</div>
			</label>
			<span className={`text-xs mt-1 font-medium ${isVisible ? 'text-green-700' : 'text-gray-500'}`}>{label}</span>
		</div>
	)
}

function Modal({ children, onClose, size = 'lg' }) {
	const sizeClasses = {
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		'4xl': 'max-w-4xl',
	}

	return (
		<div className='fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4'>
			<div
				className={`bg-white rounded-2xl shadow-2xl p-8 w-full ${sizeClasses[size]} relative flex flex-col max-h-[85vh]`}>
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
	const [isReportsSectionExpanded, setIsReportsSectionExpanded] = useState({})

	const [auditFiles, setAuditFiles] = useState({})
	const [isFilesSectionExpanded, setIsFilesSectionExpanded] = useState({})
	const [isLoadingFiles, setIsLoadingFiles] = useState(false)

	// Stan dla modali
	const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false)
	const [isDeleteAuditModalOpen, setIsDeleteAuditModalOpen] = useState(false)
	const [itemToDelete, setItemToDelete] = useState(null)
	const [selectedAuditId, setSelectedAuditId] = useState(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isDeleteReportModalOpen, setIsDeleteReportModalOpen] = useState(false)
	const [reportToDelete, setReportToDelete] = useState(null)
	const [fileToDelete, setFileToDelete] = useState(null)
	const [isDeleteFileModalOpen, setIsDeleteFileModalOpen] = useState(false)

	const [isImportModalOpen, setIsImportModalOpen] = useState(false)
	const [togglingVisibility, setTogglingVisibility] = useState({})

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

		if (isNowExpanded) {
			setIsReportsSectionExpanded(prev => ({ ...prev, [auditId]: true })) // Raporty domyślnie rozwinięte
			setIsFilesSectionExpanded(prev => ({ ...prev, [auditId]: false })) // Pliki domyślnie zwinięte

			if (!auditReports[auditId]) {
				fetchReportsForAudit(auditId)
			}
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

	const fetchFilesForAudit = useCallback(async auditId => {
		setIsLoadingFiles(true)
		try {
			const res = await fetch(`/api/files/audit/${auditId}`)
			if (!res.ok) throw new Error('Błąd pobierania plików')
			const data = await res.json()
			setAuditFiles(prev => ({ ...prev, [auditId]: data }))
		} catch (err) {
			console.error('Błąd pobierania pozostałych plików:', err)
		} finally {
			setIsLoadingFiles(false)
		}
	}, [])

	const toggleReportsSection = auditId => {
		setIsReportsSectionExpanded(prev => ({ ...prev, [auditId]: !prev[auditId] }))
	}

	const toggleFilesSection = auditId => {
		const isNowExpanded = !isFilesSectionExpanded[auditId]
		setIsFilesSectionExpanded(prev => ({ ...prev, [auditId]: isNowExpanded }))
		if (isNowExpanded && !auditFiles[auditId]) {
			fetchFilesForAudit(auditId)
		}
	}

	const openDeleteFileModal = file => {
		setFileToDelete(file)
		setIsDeleteFileModalOpen(true)
	}

	const handleDeleteFile = async () => {
		if (!fileToDelete) return

		setIsSubmitting(true)
		const res = await fetch(`/api/files/${fileToDelete.id}`, { method: 'DELETE' })
		setIsSubmitting(false)

		if (res.ok) {
			const updatedFiles = auditFiles[fileToDelete.auditId].filter(f => f.id !== fileToDelete.id)
			setAuditFiles(prev => ({ ...prev, [fileToDelete.auditId]: updatedFiles }))
			setIsDeleteFileModalOpen(false)
			setFileToDelete(null)
		} else {
			alert('Nie udało się usunąć pliku')
		}
	}

	const handleVisibilityToggle = async (type, item, auditId) => {
		const itemId = item.id
		setTogglingVisibility(prev => ({ ...prev, [itemId]: true }))

		const newVisibility = !item.isVisibleToClient
		const endpoint = type === 'report' ? `/api/reports/${itemId}/visibility` : `/api/files/${itemId}/visibility`

		const stateUpdater = type === 'report' ? setAuditReports : setAuditFiles
		stateUpdater(prev => ({
			...prev,
			[auditId]: prev[auditId].map(i => (i.id === itemId ? { ...i, isVisibleToClient: newVisibility } : i)),
		}))

		try {
			const res = await fetch(endpoint, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isVisible: newVisibility }),
			})

			if (!res.ok) {
				throw new Error('Błąd serwera')
			}
		} catch (error) {
			console.error('Nie udało się zaktualizować widoczności:', error)
			stateUpdater(prev => ({
				...prev,
				[auditId]: prev[auditId].map(i => (i.id === itemId ? { ...i, isVisibleToClient: !newVisibility } : i)),
			}))
			alert('Błąd podczas aktualizacji widoczności.')
		} finally {
			setTogglingVisibility(prev => ({ ...prev, [itemId]: false }))
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
					onClick={() => setIsImportModalOpen(true)}
					className='flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all shadow-md'>
					<Disc3 size={18} /> Importuj z Dysku
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
												<div className='bg-white rounded-xl border-2 border-gray-100 p-6 space-y-4'>
													<div>
														<button
															onClick={() => toggleReportsSection(audit.id)}
															className='flex justify-between items-center w-full py-2'>
															<h4 className='text-md font-bold text-gray-800'>Raporty</h4>
															<ChevronDown
																className={`transition-transform duration-300 ${
																	isReportsSectionExpanded[audit.id] ? 'rotate-180' : ''
																}`}
															/>
														</button>
														{isReportsSectionExpanded[audit.id] && (
															<div className='mt-2'>
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
																					<VisibilityToggle
																						isVisible={report.isVisibleToClient}
																						onToggle={() => handleVisibilityToggle('report', report, audit.id)}
																						isLoading={togglingVisibility[report.id]}
																					/>
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
														)}
													</div>
													{/* Sekcja z pozostałymi plikami */}
													<div className='pt-4 border-t border-gray-200'>
														<button
															onClick={() => toggleFilesSection(audit.id)}
															className='flex justify-between items-center w-full py-2'>
															<h5 className='text-md font-bold text-gray-800'>Pozostałe pliki</h5>
															<ChevronDown
																className={`transition-transform duration-300 ${
																	isFilesSectionExpanded[audit.id] ? 'rotate-180' : ''
																}`}
															/>
														</button>

														{isFilesSectionExpanded[audit.id] && (
															<div className='mt-2 pl-2 pr-2'>
																{isLoadingFiles ? (
																	<div className='flex justify-center items-center h-16'>
																		<LoaderCircle className='w-6 h-6 animate-spin text-red-600' />
																	</div>
																) : auditFiles[audit.id]?.length > 0 ? (
																	<div className='space-y-2'>
																		{auditFiles[audit.id].map(file => (
																			<div
																				key={file.id}
																				className='flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200'>
																				<div className='flex items-center gap-3 truncate'>
																					<FileText className='text-red-600 flex-shrink-0' size={20} />
																					<span className='text-sm text-gray-700 truncate' title={file.filename}>
																						{file.filename}
																					</span>
																				</div>
																				<div className='flex items-center gap-3'>
																					<VisibilityToggle
																						isVisible={file.isVisibleToClient}
																						onToggle={() => handleVisibilityToggle('file', file, audit.id)}
																						isLoading={togglingVisibility[file.id]}
																					/>
																					<a
																						href={file.url}
																						target='_blank'
																						rel='noopener noreferrer'
																						className='p-2 text-gray-500 hover:bg-gray-200 rounded-md'
																						title='Otwórz plik'>
																						<Download size={18} />
																					</a>
																					<button
																						onClick={() => openDeleteFileModal(file)}
																						className='p-2 text-gray-500 hover:bg-red-200 hover:text-red-700 rounded-md'
																						title='Usuń plik'>
																						<Trash2 size={18} />
																					</button>
																				</div>
																			</div>
																		))}
																	</div>
																) : (
																	<div className='text-center py-4'>
																		<p className='text-gray-500 text-sm'>Brak dodatkowych plików.</p>
																	</div>
																)}
															</div>
														)}
													</div>
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
						Czy na pewno chcesz usunąć raport: <span className='font-bold'>{reportToDelete?.title}</span>? Zostanie on
						również usunięty z Dysku Google.
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

			{isDeleteFileModalOpen && (
				<Modal onClose={() => setIsDeleteFileModalOpen(false)}>
					<h3 className='text-2xl font-bold mb-4'>Potwierdź usunięcie pliku</h3>
					<p className='text-gray-600 mb-6'>
						Czy na pewno chcesz usunąć plik: <span className='font-bold'>{fileToDelete?.filename}</span>? Zostanie on
						również usunięty z Dysku Google.
					</p>
					<div className='flex justify-end gap-4'>
						<button
							onClick={() => setIsDeleteFileModalOpen(false)}
							className='px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold'>
							Anuluj
						</button>
						<button
							onClick={handleDeleteFile}
							disabled={isSubmitting}
							className='px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold'>
							{isSubmitting && <LoaderCircle className='animate-spin' size={16} />}
							Tak, usuń
						</button>
					</div>
				</Modal>
			)}

			{isImportModalOpen && (
				<Modal onClose={() => setIsImportModalOpen(false)} size='4xl'>
					<GoogleDriveImporter
						onSuccess={() => {
							fetchAuditsAndClients()
						}}
					/>
				</Modal>
			)}
		</PanelLayout>
	)
}
