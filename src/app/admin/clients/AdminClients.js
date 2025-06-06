'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2, Edit, X, LoaderCircle, FileText } from 'lucide-react'

// Komponent Modala, aby utrzymać czystość kodu
function Modal({ children, onClose }) {
	return (
		<div className='fixed inset-0 bg-black/60 z-50 flex justify-center items-center'>
			<div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative m-4'>
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

export default function AdminClients({ session }) {
	const [clients, setClients] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	// Stan dla modali
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [clientToDelete, setClientToDelete] = useState(null)
	const [isDeleteReportModalOpen, setIsDeleteReportModalOpen] = useState(false)
	const [reportToDelete, setReportToDelete] = useState(null)

	// Stan dla formularza dodawania klienta
	const [newClient, setNewClient] = useState({ name: '', email: '', password: '' })
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Stan dla rozwijanych wierszy z audytami
	const [expandedRow, setExpandedRow] = useState(null)
	const [clientAudits, setClientAudits] = useState({})
	const [isLoadingAudits, setIsLoadingAudits] = useState(false)

	const fetchClients = useCallback(async () => {
		setIsLoading(true)
		try {
			const res = await fetch('/api/clients')
			if (!res.ok) throw new Error('Nie udało się pobrać klientów.')
			const data = await res.json()
			setClients(data)
		} catch (err) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchClients()
	}, [fetchClients])

	const handleAddClient = async e => {
		e.preventDefault()
		setIsSubmitting(true)
		setError('')
		try {
			const res = await fetch('/api/clients', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newClient),
			})
			if (!res.ok) {
				const errorData = await res.json()
				throw new Error(errorData.error || 'Błąd dodawania klienta')
			}
			await fetchClients() // Odśwież listę
			setIsAddModalOpen(false)
			setNewClient({ name: '', email: '', password: '' })
		} catch (err) {
			setError(err.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleDeleteClient = async () => {
		if (!clientToDelete) return
		setIsSubmitting(true)
		setError('')
		try {
			const res = await fetch(`/api/clients/${clientToDelete.id}`, { method: 'DELETE' })
			if (!res.ok) throw new Error('Błąd podczas usuwania klienta.')
			await fetchClients() // Odśwież listę
			setIsDeleteModalOpen(false)
			setClientToDelete(null)
		} catch (err) {
			setError(err.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	const openDeleteModal = client => {
		setClientToDelete(client)
		setIsDeleteModalOpen(true)
	}

	const toggleExpandRow = async clientId => {
		if (expandedRow === clientId) {
			setExpandedRow(null)
		} else {
			setExpandedRow(clientId)
			if (!clientAudits[clientId]) {
				setIsLoadingAudits(true)
				try {
					const res = await fetch(`/api/audits/client/${clientId}`)
					if (!res.ok) throw new Error('Nie udało się pobrać audytów.')
					const audits = await res.json()

					// Pobierz raporty do każdego audytu (logika z Twojego kodu)
					const reportsWithAuditInfo = await Promise.all(
						audits.map(async audit => {
							const reportsRes = await fetch(`/api/reports/audit/${audit.id}`)
							const reports = await reportsRes.json()
							// Dodajemy auditTitle i auditId do każdego raportu
							return reports.map(r => ({ ...r, auditTitle: audit.name, auditId: audit.id }))
						})
					)

					const flatReports = reportsWithAuditInfo.flat()
					setClientAudits(prev => ({ ...prev, [clientId]: flatReports }))
				} catch (err) {
					console.error('Błąd podczas pobierania raportów klienta:', err)
					setClientAudits(prev => ({ ...prev, [clientId]: [] }))
				} finally {
					setIsLoadingAudits(false)
				}
			}
		}
	}

	// Funkcja otwierająca modal z prośbą o potwierdzenie
	const openDeleteReportModal = (report, clientId) => {
		setReportToDelete({ ...report, clientId }) // Zapisujemy cały obiekt raportu i clientId
		setIsDeleteReportModalOpen(true)
	}

	// Funkcja, która FAKTYCZNIE usuwa raport
	const handleDeleteReport = async () => {
		if (!reportToDelete) return
		setIsSubmitting(true)
		setError('')

		try {
			// === POPRAWIONY FRAGMENT ===
			// Używamy endpointu do usunięcia konkretnego raportu po jego ID
			const res = await fetch(`/api/reports/${reportToDelete.id}`, {
				method: 'DELETE',
			})

			if (!res.ok) {
				throw new Error('Błąd podczas usuwania raportu.')
			}

			// Aktualizujemy stan lokalny, filtrując listę raportów
			// i usuwając z niej tylko ten jeden, konkretny raport.
			setClientAudits(prev => {
				const updatedReports = prev[reportToDelete.clientId].filter(r => r.id !== reportToDelete.id)
				return { ...prev, [reportToDelete.clientId]: updatedReports }
			})

			setIsDeleteReportModalOpen(false)
			setReportToDelete(null)
		} catch (err) {
			setError(err.message)
			// Opcjonalnie: zamknij modal nawet przy błędzie
			// setIsDeleteReportModalOpen(false);
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<PanelLayout session={session}>
			{/* Nagłówek strony */}
			<div className='flex justify-between items-center mb-8'>
				<div>
					<h2 className='text-3xl font-bold text-gray-800'>Zarządzanie klientami</h2>
					<p className='text-gray-500 mt-1'>Przeglądaj, dodawaj i usuwaj konta klientów.</p>
				</div>
				<button
					onClick={() => setIsAddModalOpen(true)}
					className='flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all shadow-md'>
					<Plus size={18} /> Dodaj klienta
				</button>
			</div>

			{/* Wyświetlanie błędu */}
			{error && (
				<div className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6' role='alert'>
					<p>{error}</p>
				</div>
			)}

			{/* Tabela z klientami */}
			<div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
				{isLoading ? (
					<div className='flex justify-center items-center h-64'>
						<LoaderCircle className='w-8 h-8 animate-spin text-red-600' />
					</div>
				) : (
					<table className='w-full text-sm text-left text-gray-500'>
						<thead className='text-xs text-gray-700 uppercase bg-gray-50'>
							<tr>
								<th scope='col' className='px-6 py-4'></th>
								<th scope='col' className='px-6 py-4'>
									Nazwa klienta
								</th>
								<th scope='col' className='px-6 py-4'>
									Email
								</th>
								<th scope='col' className='px-6 py-4 text-center'>
									Liczba raportów
								</th>
								<th scope='col' className='px-6 py-4 text-right'>
									Akcje
								</th>
							</tr>
						</thead>
						<tbody className='text-sm'>
							{clients.map(client => (
								<>
									<tr key={client.id} className='bg-white border-b hover:bg-gray-50/70 transition-colors'>
										<td className='px-6 py-3'>
											<button
												onClick={() => toggleExpandRow(client.id)}
												className='p-2 rounded-full hover:bg-gray-200 transition-colors'
												aria-label='Rozwiń/Zwiń'>
												<ChevronDown
													size={20}
													className={`transition-transform duration-300 ${
														expandedRow === client.id ? 'rotate-180' : ''
													}`}
												/>
											</button>
										</td>
										<td className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap'>{client.name}</td>
										<td className='px-6 py-4 text-gray-600'>{client.email}</td>
										<td className='px-6 py-4 text-gray-600 text-center font-medium'>
											{client.audits.reduce((total, audit) => total + (audit.reports?.length || 0), 0)}
										</td>
										<td className='px-6 py-4 text-right'>
											<button
												className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
												title='Edytuj klienta'>
												<Edit size={18} />
											</button>
											<button
												onClick={() => openDeleteModal(client)}
												className='p-2 text-gray-400 hover:text-red-600 transition-colors'
												title='Usuń klienta'>
												<Trash2 size={18} />
											</button>
										</td>
									</tr>
									{expandedRow === client.id && (
										<tr className='bg-gray-50'>
											<td colSpan='5' className='p-4'>
												<div className='bg-white rounded-xl border-2 border-gray-100 p-6'>
													<h4 className='text-lg font-bold mb-4 text-gray-800'>Raporty dla {client.name}</h4>
													{isLoadingAudits ? (
														<div className='flex justify-center items-center h-24'>
															<LoaderCircle className='w-8 h-8 animate-spin text-red-600' />
														</div>
													) : clientAudits[client.id]?.length > 0 ? (
														<div className='space-y-3'>
															{clientAudits[client.id].map(report => (
																<div
																	key={report.id}
																	className='flex justify-between items-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all'>
																	<div className='flex items-center gap-4'>
																		<div className='p-3 bg-red-100 rounded-full'>
																			<FileText className='text-red-600' size={20} />
																		</div>
																		<div>
																			<p className='font-bold text-md text-gray-900'>{report.auditTitle}</p>
																			<p className='text-sm text-gray-500'>
																				Raport: {report.title} (v{report.version})
																			</p>
																		</div>
																	</div>
																	<div className='flex items-center gap-3'>
																		{report.fileUrl && (
																			<a
																				href={report.fileUrl}
																				target='_blank'
																				rel='noopener noreferrer'
																				className='px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-sm'>
																				Pobierz
																			</a>
																		)}
																		<button
																			onClick={() => openDeleteReportModal(report, client.id)}
																			className='p-2 text-gray-500 bg-gray-200 rounded-md hover:bg-red-200 hover:text-red-700 transition-colors'
																			title='Usuń raport'>
																			<Trash2 size={18} />
																		</button>
																	</div>
																</div>
															))}
														</div>
													) : (
														<div className='text-center py-10'>
															<p className='text-gray-500'>Brak raportów do wyświetlenia dla tego klienta.</p>
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

			{/* Modal dodawania klienta */}
			{isAddModalOpen && (
				<Modal onClose={() => setIsAddModalOpen(false)}>
					<h3 className='text-2xl font-bold mb-6'>Dodaj nowego klienta</h3>
					<form onSubmit={handleAddClient} className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>Nazwa klienta</label>
							<input
								type='text'
								value={newClient.name}
								onChange={e => setNewClient({ ...newClient, name: e.target.value })}
								className='w-full p-2 border border-gray-300 rounded-md'
								required
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>Adres email</label>
							<input
								type='email'
								value={newClient.email}
								onChange={e => setNewClient({ ...newClient, email: e.target.value })}
								className='w-full p-2 border border-gray-300 rounded-md'
								required
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1'>Hasło</label>
							<input
								type='password'
								value={newClient.password}
								onChange={e => setNewClient({ ...newClient, password: e.target.value })}
								className='w-full p-2 border border-gray-300 rounded-md'
								required
							/>
						</div>
						{error && <p className='text-red-500 text-sm'>{error}</p>}
						<div className='flex justify-end gap-4 pt-4'>
							<button
								type='button'
								onClick={() => setIsAddModalOpen(false)}
								className='px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200'>
								Anuluj
							</button>
							<button
								type='submit'
								disabled={isSubmitting}
								className='px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2'>
								{isSubmitting && <LoaderCircle className='animate-spin' size={16} />}
								Dodaj klienta
							</button>
						</div>
					</form>
				</Modal>
			)}

			{/* Modal potwierdzenia usunięcia */}
			{isDeleteModalOpen && clientToDelete && (
				<Modal onClose={() => setIsDeleteModalOpen(false)}>
					<h3 className='text-2xl font-bold mb-4'>Potwierdź usunięcie</h3>
					<p className='text-gray-600 mb-6'>
						Czy na pewno chcesz usunąć klienta <span className='font-bold'>{clientToDelete.name}</span>? Ta operacja
						jest nieodwracalna i usunie również wszystkie jego audyty.
					</p>
					<div className='flex justify-end gap-4'>
						<button
							onClick={() => setIsDeleteModalOpen(false)}
							className='px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200'>
							Anuluj
						</button>
						<button
							onClick={handleDeleteClient}
							disabled={isSubmitting}
							className='px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2'>
							{isSubmitting && <LoaderCircle className='animate-spin' size={16} />}
							Tak, usuń
						</button>
					</div>
				</Modal>
			)}

			{/* Modal potwierdzenia usunięcia RAPORTU */}
			{isDeleteReportModalOpen && reportToDelete && (
				<Modal onClose={() => setIsDeleteReportModalOpen(false)}>
					<h3 className='text-2xl font-bold mb-4'>Potwierdź usunięcie</h3>
					<p className='text-gray-600 mb-6'>
						Czy na pewno chcesz usunąć raport:{' '}
						<span className='font-bold'>
							{reportToDelete.title} (v{reportToDelete.version})
						</span>
						? Tej operacji nie można cofnąć.
					</p>
					<div className='flex justify-end gap-4'>
						<button
							onClick={() => setIsDeleteReportModalOpen(false)}
							className='px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200'>
							Anuluj
						</button>
						<button
							onClick={handleDeleteReport}
							disabled={isSubmitting}
							className='px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2'>
							{isSubmitting && <LoaderCircle className='animate-spin' size={16} />}
							Tak, usuń raport
						</button>
					</div>
				</Modal>
			)}
		</PanelLayout>
	)
}
