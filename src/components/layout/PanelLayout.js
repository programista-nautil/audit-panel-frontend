'use client'

import Topbar from './Topbar'
import Sidebar from './Sidebar'
import { useSession } from 'next-auth/react'
import { LoaderCircle } from 'lucide-react'

export default function PanelLayout({ children }) {
	const { data: session, status } = useSession()

	if (status === 'loading') {
		return (
			<div className='flex h-screen w-full items-center justify-center bg-gray-100'>
				<LoaderCircle className='h-12 w-12 animate-spin text-red-600' />
			</div>
		)
	}

	const isClient = session?.user?.role === 'CLIENT'
	return (
		<div className={`flex h-screen ${isClient ? 'bg-red-50' : 'bg-gray-100'}`}>
			<Sidebar />
			<div className='flex flex-col flex-1'>
				<Topbar />
				<main className='p-6 overflow-y-auto'>{children}</main>
			</div>
		</div>
	)
}
