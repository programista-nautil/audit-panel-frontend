'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function Sidebar() {
	const { data: session } = useSession()
	const isClient = session?.user?.role === 'CLIENT'

	const commonLinks = [
		{ href: isClient ? '/client/dashboard' : '/admin/dashboard', label: '🏠 Pulpit' },
		{ href: isClient ? '/client/reports' : '/admin/reports', label: '📄 Raporty' },
	]

	const adminLinks = [
		{ href: '/admin/audits', label: '📋 Audyty' },
		{ href: '/admin/errors', label: '❗ Błędy' },
	]

	return (
		<div
			className={`w-64 h-screen ${isClient ? 'bg-red-600 text-white' : 'bg-white text-gray-800'} shadow-md border-r`}>
			<div className={`p-6 font-extrabold text-xl tracking-wide ${isClient ? 'text-white' : 'text-red-700'}`}>
				Audit Panel
			</div>

			<nav className='flex flex-col px-4 space-y-2'>
				{commonLinks.map(link => (
					<Link
						key={link.href}
						href={link.href}
						className={`py-2 px-2 rounded hover:underline ${isClient ? 'hover:bg-red-500' : 'hover:text-red-700'}`}>
						{link.label}
					</Link>
				))}

				{!isClient &&
					adminLinks.map(link => (
						<Link key={link.href} href={link.href} className='py-2 px-2 rounded hover:text-red-700'>
							{link.label}
						</Link>
					))}
			</nav>
		</div>
	)
}
