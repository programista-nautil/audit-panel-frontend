'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { UserCog, User, Bell, Search, ChevronDown, LogOut, Settings } from 'lucide-react'

export default function Topbar() {
	const { data: session } = useSession()
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)

	const isClient = session?.user?.role === 'CLIENT'
	const userEmail = session?.user?.email || ''
	const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : '?'

	return (
		<div className='h-20 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-sm'>
			{/* Tytuł panelu (lewa strona) */}
			<div className='flex items-center gap-3'>
				{isClient ? <User className='w-6 h-6 text-[#c53030]' /> : <UserCog className='w-6 h-6 text-red-700' />}
				<h1 className={`text-2xl font-bold tracking-wider ${isClient ? 'text-[#c53030]' : 'text-red-700'}`}>
					{isClient ? 'Panel Klienta' : 'Panel Administratora'}
				</h1>
			</div>

			{/* Elementy po prawej stronie */}
			<div className='flex items-center gap-6'>
				{/* Wyszukiwarka */}
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
					<input
						type='text'
						placeholder='Szukaj...'
						className='w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all'
					/>
				</div>

				{/* Powiadomienia */}
				<button className='relative p-2 rounded-full hover:bg-gray-100 transition-colors'>
					<Bell className='w-6 h-6 text-gray-600' />
					{/* Czerwona kropka jako wskaźnik powiadomienia */}
					<span className='absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-600'></span>
				</button>

				{/* Menu użytkownika */}
				<div className='relative'>
					<button
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						className='flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors'>
						<div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300'>
							<span className='text-lg font-semibold text-gray-600'>{userInitial}</span>
						</div>
						<ChevronDown
							className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
						/>
					</button>

					{/* Rozwijane menu */}
					{isDropdownOpen && (
						<div
							className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-20 border border-gray-100'
							onClick={() => setIsDropdownOpen(false)}>
							<div className='px-4 py-2 border-b border-gray-200'>
								<p className='text-sm font-medium text-gray-800'>Zalogowany jako</p>
								<p className='text-sm text-gray-500 truncate'>{userEmail}</p>
							</div>
							<div className='mt-2'>
								<a href='#' className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
									<Settings className='w-5 h-5' />
									<span>Ustawienia</span>
								</a>
								<button
									onClick={() => signOut({ callbackUrl: '/login' })}
									className='w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50'>
									<LogOut className='w-5 h-5' />
									<span>Wyloguj się</span>
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
