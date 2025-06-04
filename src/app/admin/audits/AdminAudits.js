'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useEffect, useState } from 'react'

export default function AdminAudits({ session }) {
	const [title, setTitle] = useState('')
	const [url, setUrl] = useState('')
	const [audits, setAudits] = useState([])

	const handleSubmit = async e => {
		e.preventDefault()
		const res = await fetch('/api/audits/url', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title, url }),
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

	useEffect(() => {
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
				<button type='submit' className='bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800'>
					Dodaj audyt
				</button>
			</form>

			<h3 className='text-xl font-semibold text-gray-800 mb-4'>Wszystkie audyty</h3>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
				{audits
					.filter(a => a.url)
					.map(audit => (
						<div key={audit.id} className='bg-white border border-gray-200 rounded-lg shadow p-5'>
							<h4 className='text-lg font-semibold text-gray-800 mb-2'>{audit.title}</h4>
							<a
								href={audit.url}
								target='_blank'
								rel='noopener noreferrer'
								className='inline-block text-center px-4 py-2 text-sm font-medium text-white bg-red-700 rounded hover:bg-red-800 transition'>
								Otwórz arkusz
							</a>
						</div>
					))}
			</div>
		</PanelLayout>
	)
}
