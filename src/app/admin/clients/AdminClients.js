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

	const [expanded, setExpanded] = useState({})
	const [clientAudits, setClientAudits] = useState({})

	useEffect(() => {
		fetch('/api/clients')
			.then(res => res.json())
			.then(data => setClients(data))
	}, [])

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
		setExpanded(prev => ({ ...prev, [clientId]: !prev[clientId] }))

		if (!clientAudits[clientId]) {
			try {
				const res = await fetch(`/api/audits/client/${clientId}`)
				const audits = await res.json()

				// Pobierz raporty do każdego audytu
				const reportsWithAuditInfo = await Promise.all(
					audits.map(async audit => {
						const reportsRes = await fetch(`/api/reports/audit/${audit.id}`)
						const reports = await reportsRes.json()
						return reports.map(r => ({ ...r, auditTitle: audit.title }))
					})
				)

				const flatReports = reportsWithAuditInfo.flat()

				setClientAudits(prev => ({ ...prev, [clientId]: flatReports }))
			} catch (err) {
				console.error('Błąd podczas pobierania raportów klienta:', err)
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
										{clientAudits[client.id].map(report => (
											<li key={report.id} className='flex justify-between items-center'>
												<div className='flex gap-2 items-center'>
													<span>
														{report.title} v{report.version}
													</span>
													{report.fileUrl && (
														<a
															href={report.fileUrl}
															target='_blank'
															rel='noopener noreferrer'
															className='text-blue-600 underline text-xs'>
															Plik
														</a>
													)}
												</div>
											</li>
										))}
									</ul>
								) : (
									<p className='text-gray-500 text-sm'>Brak raportów</p>
								)}
							</div>
						)}
					</div>
				))}
			</div>
		</PanelLayout>
	)
}
