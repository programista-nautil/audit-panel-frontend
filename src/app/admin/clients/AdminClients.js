'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useState, useEffect } from 'react'

export default function AdminClients({ session }) {
	const [clients, setClients] = useState([])
	const [email, setEmail] = useState('')
	const [name, setName] = useState('')
	const [password, setPassword] = useState('')

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
				<button type='submit' className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'>
					Dodaj klienta
				</button>
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
								<form
									onSubmit={async e => {
										e.preventDefault()
										const formData = new FormData(e.target)
										await fetch('/api/audits', {
											method: 'POST',
											body: formData,
										})
										alert('Audyt przypisany!')
									}}
									encType='multipart/form-data'>
									<input type='hidden' name='clientId' value={client.id} />
									<input type='text' name='title' placeholder='Tytuł audytu' required className='border p-1 mr-2' />
									<input type='file' name='file' accept='application/pdf' required className='mr-2' />
									<button type='submit' className='bg-blue-600 text-white px-2 py-1 rounded'>
										Wyślij audyt
									</button>
								</form>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</PanelLayout>
	)
}
