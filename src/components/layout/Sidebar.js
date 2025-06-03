'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Home, FileText, ClipboardList, AlertCircle, Users } from 'lucide-react'

export default function Sidebar() {
	const { data: session } = useSession()
	const isClient = session?.user?.role === 'CLIENT'

	const commonLinks = [
		{
			href: isClient ? '/client/dashboard' : '/admin/dashboard',
			label: 'Pulpit',
			icon: <Home className='w-5 h-5' />,
		},
		{
			href: isClient ? '/client/reports' : '/admin/reports',
			label: 'Raporty',
			icon: <FileText className='w-5 h-5' />,
		},
		{
			href: isClient ? '/client/audits' : '/admin/audits',
			label: 'Audyty',
			icon: <ClipboardList className='w-5 h-5' />,
		},
	]

	const adminLinks = [
		{
			href: '/admin/errors',
			label: 'Błędy',
			icon: <AlertCircle className='w-5 h-5' />,
		},
		{
			href: '/admin/clients',
			label: 'Klienci',
			icon: <Users className='w-5 h-5' />,
		},
	]

	return (
		<div
			className={`w-64 h-screen ${isClient ? 'bg-red-600 text-white' : 'bg-white text-gray-800'} shadow-md border-r`}>
			{/* Logo */}
			<div className='p-6 flex justify-center items-center'>
				<img src='/nautil-logo-czarne.svg' alt='Logo' className='h-12 w-auto' />
			</div>

			<nav className='flex flex-col px-4 space-y-1 mt-4'>
				{commonLinks.map(link => (
					<Link
						key={link.href}
						href={link.href}
						className={`flex items-center gap-2 py-2 px-3 rounded transition ${
							isClient ? 'hover:bg-red-500 text-white' : 'hover:bg-gray-100 hover:text-red-700'
						}`}>
						{link.icon}
						<span className='font-medium'>{link.label}</span>
					</Link>
				))}

				{!isClient &&
					adminLinks.map(link => (
						<Link
							key={link.href}
							href={link.href}
							className='flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 hover:text-red-700'>
							{link.icon}
							<span className='font-medium'>{link.label}</span>
						</Link>
					))}
			</nav>
		</div>
	)
}
