'use client'

import { signOut, useSession } from 'next-auth/react'
import { UserCog, User } from 'lucide-react'

export default function Topbar() {
	const { data: session } = useSession()
	const isClient = session?.user?.role === 'CLIENT'
	const userEmail = session?.user?.email || ''

	return (
		<div
			className={`h-16 flex items-center justify-between px-6 shadow-sm ${
				isClient ? 'bg-red-600 text-white' : 'bg-white border-b border-gray-200 text-gray-800'
			}`}>
			{/* Tytuł panelu */}
			<div className='flex items-center gap-2'>
				{isClient ? <User className='w-5 h-5 text-white' /> : <UserCog className='w-5 h-5 text-red-700' />}
				<h1 className={`text-xl font-bold tracking-wide ${isClient ? 'text-white' : 'text-red-700'}`}>
					{isClient ? 'Panel Klienta' : 'Panel Administratora'}
				</h1>
			</div>

			{/* Prawa strona: email + wylogowanie */}
			<div className='flex items-center gap-4'>
				<span className='text-sm font-medium'>{userEmail}</span>
				<button
					onClick={() => signOut({ callbackUrl: '/login' })}
					className={`text-sm px-4 py-1 rounded font-semibold transition ${
						isClient ? 'bg-white text-red-600 hover:bg-red-100' : 'bg-red-600 text-white hover:bg-red-700'
					}`}>
					Wyloguj się
				</button>
			</div>
		</div>
	)
}
