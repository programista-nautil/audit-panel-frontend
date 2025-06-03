'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function AdminClients({ session }) {
	const [clients, setClients] = useState([])
	const [email, setEmail] = useState('')
	const [name, setName] = useState('')
	const [password, setPassword] = useState('')

	const [showModal, setShowModal] = useState(false)
	const [selectedClientId, setSelectedClientId] = useState(null)
	const [auditTitle, setAuditTitle] = useState('')
	const [auditFile, setAuditFile] = useState(null)

	const [expanded, setExpanded] = useState({})
	const [clientAudits, setClientAudits] = useState({})

	const openModal = clientId => {
		setSelectedClientId(clientId)
		setShowModal(true)
	}

	const sendAudit = async e => {
		e.preventDefault()
		if (!auditTitle || !auditFile || !selectedClientId) return

		const formData = new FormData()
		formData.append('title', auditTitle)
		formData.append('file', auditFile)
		formData.append('clientId', selectedClientId)

		const res = await fetch('/api/audits', {
			method: 'POST',
			body: formData,
		})

		if (res.ok) {
			alert('Audyt przypisany!')
			setShowModal(false)
			setAuditTitle('')
			setAuditFile(null)
		} else {
			alert('Błąd przy wysyłaniu audytu')
		}
	}

	useEffect(() => {
		fetch('/api/clients')
			.then(res => res.json())
			.then(data => setClients(data))
	}, [clients])

	const deleteClient = async id => {
		if (!confirm('Na pewno chcesz usunąć tego klienta i jego audyty?')) return
		const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })

		if (res.ok) {
			setClients(prev => prev.filter(c => c.id !== id))
			alert('Klient usunięty')
		} else {
			alert('Błąd podczas usuwania')
		}
	}

	const deleteAudit = async (auditId, clientId) => {
		const confirmed = confirm('Czy na pewno chcesz usunąć ten audyt?')
		if (!confirmed) return

		const res = await fetch(`/api/audits/${auditId}`, {
			method: 'DELETE',
		})

		if (res.ok) {
			setClientAudits(prev => ({
				...prev,
				[clientId]: prev[clientId].filter(a => a.id !== auditId),
			}))
		} else {
			alert('Błąd podczas usuwania audytu')
		}
	}

	const toggleExpand = async clientId => {
		setExpanded(prev => {
			const isNowExpanded = !prev[clientId]

			if (isNowExpanded && !clientAudits[clientId]) {
				fetch(`/api/audits/client/${clientId}`)
					.then(res => res.json())
					.then(data => {
						setClientAudits(prevAudits => ({ ...prevAudits, [clientId]: data }))
					})
			}
			return { ...prev, [clientId]: isNowExpanded }
		})

		// pobierz audyty TYLKO jeśli użytkownik chce rozwinąć (czyli było false → true)
		if (!expanded[clientId] && !clientAudits[clientId]) {
			try {
				const res = await fetch(`/api/audits/client/${clientId}`)
				const data = await res.json()
				setClientAudits(prev => ({ ...prev, [clientId]: data }))
			} catch (err) {
				console.error('Błąd podczas pobierania audytów:', err)
			}
		}
	}

	const handleAddClient = async e => {
		e.preventDefault()
		const res = await fetch('/api/clients', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password, name }),
		})
		if (res.ok) {
			setEmail('')
			setPassword('')
			setName('')
			const newClient = await res.json()
			setClients([...clients, newClient])
		} else {
			alert('Błąd dodawania klienta')
		}
	}

	return (
		<PanelLayout session={session}>
			<h2 className='text-2xl font-bold text-gray-800 mb-6'>Lista klientów</h2>

			<form onSubmit={handleAddClient} className='mb-6 flex gap-4 items-end'>
				<div>
					<label className='block text-sm font-medium'>Nazwa</label>
					<input
						className='border rounded p-2'
						type='text'
						value={name}
						onChange={e => setName(e.target.value)}
						required
					/>
				</div>
				<div>
					<label className='block text-sm font-medium'>Email</label>
					<input
						className='border rounded p-2'
						type='email'
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
				</div>
				<div>
					<label className='block text-sm font-medium'>Hasło</label>
					<input
						className='border rounded p-2'
						type='password'
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
					/>
				</div>
				<Button variant='red' type='submit'>
					Dodaj klienta
				</Button>
			</form>

			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start'>
				{clients.map(client => (
					<div key={client.id} className='bg-white rounded shadow p-4 border border-gray-200'>
						<div className='flex justify-between items-start'>
							<div>
								<h3 className='text-lg font-semibold text-gray-800'>{client.name}</h3>
								<p className='text-sm text-gray-600'>{client.email}</p>
							</div>
							<div className='flex gap-2 items-center'>
								<div className='relative group'>
									<Button
										variant='red'
										className='text-red-700 hover:text-red-800 p-1 cursor-pointer'
										onClick={() => openModal(client.id)}
										aria-label='Wyślij audyt'>
										<Send size={20} />
									</Button>
									<div className='absolute bottom-full mb-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition transform bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50'>
										Wyślij audyt
									</div>
								</div>
								<div className='relative group'>
									<Button
										variant='gray'
										className='p-1 text-gray-600 hover:text-red-700 cursor-pointer'
										onClick={() => deleteClient(client.id)}
										aria-label='Usuń klienta'>
										<Trash2 size={20} />
									</Button>
									<div className='absolute bottom-full mb-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition transform bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50'>
										Usuń klienta
									</div>
								</div>
								<div className='relative group'>
									<button className='cursor-pointer' onClick={() => toggleExpand(client.id)}>
										{expanded[client.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
									</button>
									<div className='absolute bottom-full mb-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition transform bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50'>
										Rozwiń/Schowaj
									</div>
								</div>
							</div>
						</div>

						{expanded[client.id] && (
							<div className='mt-4 bg-gray-50 border-t pt-2'>
								{clientAudits[client.id]?.length > 0 ? (
									<ul className='text-sm space-y-1'>
										{clientAudits[client.id].map(audit => (
											<li key={audit.id} className='flex justify-between items-center'>
												<div className='flex gap-2 items-center'>
													<span>{audit.title}</span>
													{audit.files?.[0] && (
														<a
															href={audit.files[0].url}
															target='_blank'
															rel='noopener noreferrer'
															className='text-blue-600 underline text-xs'>
															PDF
														</a>
													)}
													<button
														onClick={() => deleteAudit(audit.id, client.id)}
														className='text-xs text-red-600 hover:text-red-800 cursor-pointer'>
														Usuń
													</button>
												</div>
											</li>
										))}
									</ul>
								) : (
									<p className='text-gray-500 text-sm'>Brak audytów</p>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{showModal && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
					<div className='bg-white p-6 rounded shadow-lg w-96'>
						<h3 className='text-xl font-bold mb-4'>Wyślij audyt</h3>
						<form onSubmit={sendAudit}>
							<label className='block mb-2'>
								Tytuł audytu:
								<input
									type='text'
									className='border rounded p-2 w-full mt-1'
									value={auditTitle}
									onChange={e => setAuditTitle(e.target.value)}
									required
								/>
							</label>
							<label className='block mb-4'>
								<span className='block mb-1 font-medium'>Plik PDF:</span>
								<div className='relative'>
									<input
										type='file'
										accept='application/pdf'
										onChange={e => setAuditFile(e.target.files[0])}
										required
										className='block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-700 file:text-white hover:file:bg-red-800 cursor-pointer'
									/>
								</div>
							</label>

							<div className='flex justify-end gap-2'>
								<Button variant='gray' type='button' onClick={() => setShowModal(false)}>
									Anuluj
								</Button>
								<Button variant='red' type='submit'>
									Wyślij
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</PanelLayout>
	)
}
