import AdminLayout from '@/components/layout/AdminLayout'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export default async function AdminDashboard() {
	const session = await getServerSession(authOptions)

	if (!session || session.user.role !== 'ADMIN') {
		return <p className='p-10 text-red-700 font-bold'>Brak dostępu</p>
	}

	return (
		<AdminLayout>
			<h2 className='text-2xl font-bold text-gray-800 mb-4'>Witaj {session.user.name}!</h2>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<div className='bg-white p-6 shadow rounded-lg border-l-4 border-red-600'>
					<h3 className='text-lg font-semibold'>Liczba audytów</h3>
					<p className='text-2xl font-bold text-red-700 mt-2'>12</p>
				</div>
				<div className='bg-white p-6 shadow rounded-lg border-l-4 border-red-600'>
					<h3 className='text-lg font-semibold'>Błędy ogółem</h3>
					<p className='text-2xl font-bold text-red-700 mt-2'>75</p>
				</div>
				<div className='bg-white p-6 shadow rounded-lg border-l-4 border-red-600'>
					<h3 className='text-lg font-semibold'>Zgłoszenia klientów</h3>
					<p className='text-2xl font-bold text-red-700 mt-2'>3</p>
				</div>
			</div>
		</AdminLayout>
	)
}
