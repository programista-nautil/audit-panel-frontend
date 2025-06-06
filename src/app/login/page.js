'use client'

import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, LoaderCircle } from 'lucide-react'

export default function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [roleView, setRoleView] = useState('ADMIN')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isPasswordVisible, setIsPasswordVisible] = useState(false)
	const router = useRouter()

	const handleLogin = async e => {
		e.preventDefault()
		setIsLoading(true)
		setError('')

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
				setError(
					`Logujesz się do panelu ${roleView.toLowerCase()}, a Twoje konto ma rolę ${session.user.role.toLowerCase()}. Zmień panel i spróbuj ponownie.`
				)
				setIsLoading(false)
				return
			}

			const targetDashboard = session?.user?.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'
			router.push(targetDashboard)
		} else {
			setError('Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.')
			setIsLoading(false)
		}
	}

	const isAdminView = roleView === 'ADMIN'

	return (
		<div className='min-h-screen w-full lg:grid lg:grid-cols-2'>
			{/* Lewa strona - branding */}
			<div className='hidden lg:flex flex-col items-center justify-center bg-[#c53030] p-12 text-white'>
				<img src='/nautil-logo-biale.png' alt='Logo' className='h-20 w-auto mb-8' />
				<div className='text-center'>
					<h1 className='text-4xl font-bold tracking-wider'>Witaj w panelu!</h1>
					<p className='mt-4 text-lg text-white/80 max-w-sm'>
						Zaloguj się, aby uzyskać dostęp do swoich audytów, raportów i zarządzać kontem.
					</p>
				</div>
			</div>

			{/* Prawa strona - formularz logowania */}
			<div className='flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50'>
				<div className='w-full max-w-md space-y-8'>
					{/* Logo dla widoku mobilnego */}
					<div className='lg:hidden flex justify-center'>
						<img src='/nautil-logo-czarne.svg' alt='Logo' className='h-16 w-auto' />
					</div>

					<div>
						<h2 className='text-center text-3xl font-bold tracking-tight text-gray-900'>
							Zaloguj się do swojego konta
						</h2>
					</div>

					{/* Przełącznik ról */}
					<div className='flex justify-center bg-gray-200 rounded-full p-1'>
						<button
							type='button'
							onClick={() => {
								setRoleView('ADMIN')
								setError('')
							}}
							className={`w-full px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
								isAdminView ? 'bg-white shadow' : 'text-gray-600'
							}`}>
							Administrator
						</button>
						<button
							type='button'
							onClick={() => {
								setRoleView('CLIENT')
								setError('')
							}}
							className={`w-full px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
								!isAdminView ? 'bg-white shadow' : 'text-gray-600'
							}`}>
							Klient
						</button>
					</div>

					<form className='mt-8 space-y-6' onSubmit={handleLogin}>
						<div className='rounded-md shadow-sm -space-y-px'>
							{/* Pole E-mail */}
							<div className='relative'>
								<Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
								<input
									type='email'
									autoComplete='email'
									className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition'
									placeholder='Adres e-mail'
									value={email}
									onChange={e => setEmail(e.target.value)}
									required
								/>
							</div>
							{/* Pole Hasło */}
							<div className='relative mt-4'>
								<Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
								<input
									type={isPasswordVisible ? 'text' : 'password'}
									autoComplete='current-password'
									className='w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition'
									placeholder='Hasło'
									value={password}
									onChange={e => setPassword(e.target.value)}
									required
								/>
								<button
									type='button'
									onClick={() => setIsPasswordVisible(!isPasswordVisible)}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
									{isPasswordVisible ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
								</button>
							</div>
						</div>

						{/* Komunikat o błędzie */}
						{error && (
							<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm'>
								<p>{error}</p>
							</div>
						)}

						<div>
							<button
								type='submit'
								disabled={isLoading}
								className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#c53030] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50'>
								{isLoading ? <LoaderCircle className='animate-spin w-5 h-5' /> : 'Zaloguj się'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}
