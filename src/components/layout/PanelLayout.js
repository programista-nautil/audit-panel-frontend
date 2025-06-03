'use client'

import Topbar from './Topbar'
import Sidebar from './Sidebar'
import { useSession } from 'next-auth/react'

export default function PanelLayout({ children }) {
	const { data: session } = useSession()
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
