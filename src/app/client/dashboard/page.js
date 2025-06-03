import PanelLayout from '@/components/layout/PanelLayout'
import { withAuth } from '@/lib/withAuth'

function ClientDashboard({ session }) {
	return (
		<PanelLayout>
			<h2 className='text-2xl font-bold text-red-700 mb-4'>Witaj {session.user.name}!</h2>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<div className='bg-white p-6 shadow rounded-lg border-l-4 border-red-500'>
					<h3 className='text-lg font-semibold'>Twoje audyty</h3>
					<p className='text-2xl font-bold text-red-600 mt-2'>5</p>
				</div>
				<div className='bg-white p-6 shadow rounded-lg border-l-4 border-red-500'>
					<h3 className='text-lg font-semibold'>Oczekujące poprawki</h3>
					<p className='text-2xl font-bold text-red-600 mt-2'>2</p>
				</div>
			</div>
		</PanelLayout>
	)
}

export const dynamic = 'force-dynamic'
export default withAuth({ role: 'CLIENT' })(ClientDashboard)
