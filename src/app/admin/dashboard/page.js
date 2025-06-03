import PanelLayout from '@/components/layout/PanelLayout'
import { withAuth } from '@/lib/withAuth'

function AdminDashboard({ session }) {
	return (
		<PanelLayout>
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
		</PanelLayout>
	)
}

export const dynamic = 'force-dynamic'
export default withAuth({ role: 'ADMIN' })(AdminDashboard)
