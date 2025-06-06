'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Przykładowe dane - w przyszłości można je zasilać z API
const data = [
	{ month: 'Styczeń', 'Nowe audyty': 4, Zakończone: 3 },
	{ month: 'Luty', 'Nowe audyty': 3, Zakończone: 5 },
	{ month: 'Marzec', 'Nowe audyty': 6, Zakończone: 4 },
	{ month: 'Kwiecień', 'Nowe audyty': 5, Zakończone: 6 },
	{ month: 'Maj', 'Nowe audyty': 8, Zakończone: 7 },
	{ month: 'Czerwiec', 'Nowe audyty': 7, Zakończone: 9 },
]

export function AdminAuditsChart() {
	return (
		<div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100'>
			<h3 className='text-lg font-semibold text-gray-800 mb-4'>Aktywność audytów w ostatnim półroczu</h3>
			<ResponsiveContainer width='100%' height={350}>
				<BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
					<CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
					<XAxis dataKey='month' tick={{ fill: '#6b7280' }} />
					<YAxis tick={{ fill: '#6b7280' }} />
					<Tooltip
						cursor={{ fill: 'rgba(239, 68, 68, 0.1)' }}
						contentStyle={{
							background: '#fff',
							border: '1px solid #e5e7eb',
							borderRadius: '0.5rem',
						}}
					/>
					<Legend iconType='circle' iconSize={10} />
					<Bar dataKey='Nowe audyty' fill='#ef4444' name='Nowe audyty' radius={[4, 4, 0, 0]} />
					<Bar dataKey='Zakończone' fill='#f87171' name='Zakończone audyty' radius={[4, 4, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
