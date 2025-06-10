'use client'

import PanelLayout from '@/components/layout/PanelLayout'
import { useState } from 'react'
import { Lock, LoaderCircle } from 'lucide-react'

export default function ClientSettingsPage() {
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async e => {
		e.preventDefault()
		setError('')
		setSuccess('')

		if (newPassword !== confirmPassword) {
			setError('Nowe hasła nie są identyczne.')
			return
		}

		setIsLoading(true)
		try {
			const res = await fetch('/api/user/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword }),
			})

			const data = await res.json()

			if (!res.ok) {
				throw new Error(data.error || 'Wystąpił nieoczekiwany błąd')
			}

			setSuccess(data.message)
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (err) {
			setError(err.message)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<PanelLayout>
			<div>
				{/* Nagłówek strony */}
				<div>
					<h2 className='text-3xl font-bold text-gray-800'>Ustawienia konta</h2>
					<p className='text-gray-500 mt-1'>Zarządzaj swoimi danymi i bezpieczeństwem konta.</p>
				</div>

				{/* Formularz zmiany hasła */}
				<div className='mt-8 max-w-2xl'>
					<form onSubmit={handleSubmit} className='bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6'>
						<h3 className='text-xl font-bold text-gray-800 flex items-center gap-3'>
							<Lock className='text-red-600' />
							Zmień hasło
						</h3>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='current-password'>
								Obecne hasło
							</label>
							<input
								id='current-password'
								type='password'
								value={currentPassword}
								onChange={e => setCurrentPassword(e.target.value)}
								required
								className='w-full p-2.5 border border-gray-300 rounded-lg'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='new-password'>
								Nowe hasło
							</label>
							<input
								id='new-password'
								type='password'
								value={newPassword}
								onChange={e => setNewPassword(e.target.value)}
								required
								className='w-full p-2.5 border border-gray-300 rounded-lg'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='confirm-password'>
								Potwierdź nowe hasło
							</label>
							<input
								id='confirm-password'
								type='password'
								value={confirmPassword}
								onChange={e => setConfirmPassword(e.target.value)}
								required
								className='w-full p-2.5 border border-gray-300 rounded-lg'
							/>
						</div>

						{/* Komunikaty o błędach i sukcesie */}
						{error && <div className='text-sm text-red-600 bg-red-50 p-3 rounded-lg'>{error}</div>}
						{success && <div className='text-sm text-green-700 bg-green-50 p-3 rounded-lg'>{success}</div>}

						<div className='pt-4 flex justify-end'>
							<button
								type='submit'
								disabled={isLoading}
								className='px-6 py-2.5 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold'>
								{isLoading ? (
									<>
										<LoaderCircle className='animate-spin' size={16} /> Zapisywanie...
									</>
								) : (
									'Zapisz zmiany'
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</PanelLayout>
	)
}
