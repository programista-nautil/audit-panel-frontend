'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'
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
	}, [])

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

			<table className='w-full text-sm border'>
				<thead className='bg-gray-100'>
					<tr>
						<th className='text-left p-2 border-b'>Nazwa</th>
						<th className='text-left p-2 border-b'>Email</th>
					</tr>
				</thead>
				<tbody>
					{clients.map(client => (
						<tr key={client.id}>
							<td className='p-2 border-b'>{client.name}</td>
							<td className='p-2 border-b'>{client.email}</td>
							<td className='p-2 border-b'>
								<div className='relative group inline-block'>
									<Button
										variant='red'
										className='text-red-600 hover:text-red-800 p-1 cursor-pointer'
										onClick={() => openModal(client.id)}
										aria-label='Wyślij audyt'>
										<Send size={20} />
									</Button>
									<div className='absolute bottom-full mb-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition transform bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50'>
										Wyślij audyt
									</div>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
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
