'use client'

import { signOut } from 'next-auth/react'

export default function Topbar() {
	return (
		<div className='h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm'>
			<h1 className='text-xl font-semibold text-red-700'>Panel Administratora</h1>
			<div className='text-sm text-gray-600'>admin@twojadomena.pl</div>
			<button
				onClick={() => signOut({ callbackUrl: '/admin/login' })}
				className='text-sm bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700'>
				Wyloguj się
			</button>
		</div>
	)
}
