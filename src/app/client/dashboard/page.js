import { withAuth } from '@/lib/withAuth'

function ClientDashboard({ session }) {
	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold text-red-700'>Witaj, {session.user.name}!</h1>
			<p>To jest panel klienta.</p>
		</div>
	)
}

export const dynamic = 'force-dynamic'
export default withAuth({ role: 'CLIENT' })(ClientDashboard)
