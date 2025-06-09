'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Home, FileText, ClipboardList, AlertCircle, Users, LifeBuoy, TestTube, Paperclip } from 'lucide-react'

export default function Sidebar() {
	const pathname = usePathname()
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
		{
			href: '/client/files',
			label: 'Inne pliki',
			icon: <Paperclip className='w-5 h-5' />,
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
		{
			href: '/admin/google-drive-test',
			label: 'Test Google Drive',
			icon: <TestTube className='w-5 h-5' />,
		},
	]

	const baseLinkClasses = 'flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200'

	// Styl dla klienta
	const clientActiveClasses = 'bg-white/20 font-semibold'
	const clientInactiveClasses = 'text-white/80 hover:bg-white/10 hover:text-white'

	// Styl dla admina
	const adminActiveClasses = 'bg-red-50 text-red-600 font-semibold'
	const adminInactiveClasses = 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'

	return (
		<div
			className={`w-72 h-screen flex flex-col ${
				isClient ? 'bg-[#c53030] text-white' : 'bg-white text-gray-800 border-r border-gray-200'
			}`}>
			{/* Logo */}
			<div
				className={`h-20 flex items-center px-8 ${isClient ? 'border-b border-white/20' : 'border-b border-gray-200'}`}>
				<img src={isClient ? '/nautil-logo-biale.png' : '/nautil-logo-czarne.svg'} alt='Logo' className='h-18 w-auto' />
			</div>

			{/* Nawigacja */}
			<nav className='flex-1 flex flex-col p-4 space-y-2'>
				{commonLinks.map(link => {
					const isActive = pathname === link.href
					const clientClasses = isActive ? clientActiveClasses : clientInactiveClasses
					const adminClasses = isActive ? adminActiveClasses : adminInactiveClasses

					return (
						<Link
							key={link.href}
							href={link.href}
							className={`${baseLinkClasses} ${isClient ? clientClasses : adminClasses}`}>
							{link.icon}
							<span className='text-md'>{link.label}</span>
						</Link>
					)
				})}

				{!isClient &&
					adminLinks.map(link => {
						const isActive = pathname.startsWith(link.href)
						return (
							<Link
								key={link.href}
								href={link.href}
								className={`${baseLinkClasses} ${isActive ? adminActiveClasses : adminInactiveClasses}`}>
								{link.icon}
								<span className='text-md'>{link.label}</span>
							</Link>
						)
					})}

				{/* Sekcja na dole */}
				<div className='mt-auto'>
					<Link href='#' className={`${baseLinkClasses} ${isClient ? clientInactiveClasses : adminInactiveClasses}`}>
						<LifeBuoy className='w-5 h-5' />
						<span className='text-md'>Pomoc i wsparcie</span>
					</Link>
				</div>
			</nav>
		</div>
	)
}
