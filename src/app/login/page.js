'use client'

import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [roleView, setRoleView] = useState('ADMIN')
	const router = useRouter()

	const handleLogin = async e => {
		e.preventDefault()
		const res = await signIn('credentials', {
			email,
			password,
			redirect: false,
		})

		if (res.ok) {
			const response = await fetch('/api/auth/session')
			const session = await response.json()

			if (session?.user?.role !== roleView) {
				await signOut({ redirect: false })
				alert(
					`Nieprawidłowa rola: wybrano ${roleView.toLowerCase()}, ale konto ma rolę ${session.user.role.toLowerCase()}`
				)
				return
			}

			if (session?.user?.role === 'ADMIN') {
				router.push('/admin/dashboard')
			} else if (session?.user?.role === 'CLIENT') {
				router.push('/client/dashboard')
			} else {
				alert('Nieznana rola użytkownika')
			}
		} else {
			alert('Błędne dane logowania')
		}
	}

	const isAdmin = roleView === 'ADMIN'
	const bgColor = isAdmin ? 'bg-white' : 'bg-red-50'
	const headingText = isAdmin ? 'text-black' : 'text-red-800'
	const buttonColor = 'bg-red-600 hover:bg-red-700'
	const switchActive = 'bg-red-600 text-white'
	const switchInactive = 'bg-gray-200 text-gray-700'

	return (
		<div className={`h-screen flex justify-center items-center ${bgColor} transition-colors duration-300 px-4`}>
			<form
				onSubmit={handleLogin}
				className='bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100'>
				{/* Przełącznik ról */}
				<div className='flex justify-center mb-6'>
					<button
						type='button'
						onClick={() => setRoleView('ADMIN')}
						className={`px-5 py-2 rounded-l-full font-medium text-sm transition-all ${
							isAdmin ? switchActive : switchInactive
						}`}>
						Administrator
					</button>
					<button
						type='button'
						onClick={() => setRoleView('CLIENT')}
						className={`px-5 py-2 rounded-r-full font-medium text-sm transition-all ${
							!isAdmin ? switchActive : switchInactive
						}`}>
						Klient
					</button>
				</div>

				<h2 className={`text-2xl font-bold text-center mb-6 tracking-wide ${headingText}`}>
					Logowanie {isAdmin ? 'administratora' : 'klienta'}
				</h2>

				<label className='block text-sm font-semibold text-gray-600 mb-1'>Adres e-mail</label>
				<input
					type='email'
					className='w-full mb-4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-300 transition'
					placeholder='np. jan.kowalski@firma.pl'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
				/>

				<label className='block text-sm font-semibold text-gray-600 mb-1'>Hasło</label>
				<input
					type='password'
					className='w-full mb-6 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-300 transition'
					placeholder='••••••••'
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
				/>

				<button
					type='submit'
					className={`w-full ${buttonColor} text-white py-3 rounded-md font-semibold text-sm tracking-wide transition`}>
					Zaloguj się
				</button>
			</form>
		</div>
	)
}
