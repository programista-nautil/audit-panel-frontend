'use client'

import { signOut, useSession } from 'next-auth/react'

export default function Topbar() {
	const { data: session } = useSession()
	const isClient = session?.user?.role === 'CLIENT'
	const userEmail = session?.user?.email || ''

	return (
		<div
			className={`h-16 flex items-center justify-between px-6 shadow-sm ${
				isClient ? 'bg-red-600 text-white' : 'bg-white border-b border-gray-200 text-gray-800'
			}`}>
			<h1 className={`text-xl font-bold tracking-wide ${isClient ? 'text-white' : 'text-red-700'}`}>
				{isClient ? 'Panel Klienta' : 'Panel Administratora'}
			</h1>

			<div className='text-sm'>{userEmail}</div>

			<button
				onClick={() => signOut({ callbackUrl: '/login' })}
				className={`text-sm px-4 py-1 rounded font-medium ${
					isClient ? 'bg-white text-red-600 hover:bg-red-100' : 'bg-red-600 text-white hover:bg-red-700'
				}`}>
				Wyloguj się
			</button>
		</div>
	)
}
