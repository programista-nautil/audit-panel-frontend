import Link from 'next/link'

export default function Sidebar() {
	return (
		<div className='w-64 bg-white shadow-md border-r border-gray-200'>
			<div className='p-6 text-red-700 font-bold text-xl'>Audit Panel</div>
			<nav className='flex flex-col px-4'>
				<Link href='/admin/dashboard' className='py-2 hover:text-red-700'>
					🏠 Pulpit
				</Link>
				<Link href='/admin/audits' className='py-2 hover:text-red-700'>
					📋 Audyty
				</Link>
				<Link href='/admin/errors' className='py-2 hover:text-red-700'>
					❗ Błędy
				</Link>
				<Link href='/admin/reports' className='py-2 hover:text-red-700'>
					📄 Raporty
				</Link>
			</nav>
		</div>
	)
}
