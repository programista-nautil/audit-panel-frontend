'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLogin() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const router = useRouter()

	const handleLogin = async e => {
		e.preventDefault()
		const res = await signIn('credentials', {
			email,
			password,
			redirect: false,
		})

		if (res.ok) {
			router.push('/admin/dashboard')
		} else {
			alert('Błąd logowania')
		}
	}

	return (
		<div className='h-screen flex justify-center items-center bg-gray-100'>
			<form onSubmit={handleLogin} className='bg-white p-6 rounded shadow max-w-sm w-full'>
				<h2 className='text-xl mb-4'>Logowanie admina</h2>
				<input
					className='w-full mb-3 p-2 border rounded'
					placeholder='Email'
					value={email}
					onChange={e => setEmail(e.target.value)}
				/>
				<input
					type='password'
					className='w-full mb-3 p-2 border rounded'
					placeholder='Hasło'
					value={password}
					onChange={e => setPassword(e.target.value)}
				/>
				<button type='submit' className='w-full bg-red-600 text-white py-2 rounded'>
					Zaloguj się
				</button>
			</form>
		</div>
	)
}
