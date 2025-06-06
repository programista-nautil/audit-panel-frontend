'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
	DRAFT: '#f59e0b', // Amber
	SENT: '#3b82f6', // Blue
	COMPLETED: '#16a34a', // Green
	ARCHIVED: '#6b7280', // Gray
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5
	const x = cx + radius * Math.cos(-midAngle * RADIAN)
	const y = cy + radius * Math.sin(-midAngle * RADIAN)

	return (
		<text
			x={x}
			y={y}
			fill='white'
			textAnchor={x > cx ? 'start' : 'end'}
			dominantBaseline='central'
			className='font-bold text-sm'>
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	)
}

export function AuditStatusChart({ data }) {
	const chartData = Object.entries(data).map(([name, value]) => ({ name, value }))

	return (
		<div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-full'>
			<h3 className='text-lg font-semibold text-gray-800 mb-4'>Status Twoich audytów</h3>
			<ResponsiveContainer width='100%' height={300}>
				<PieChart>
					<Pie
						data={chartData}
						cx='50%'
						cy='50%'
						labelLine={false}
						label={renderCustomizedLabel}
						outerRadius={110}
						fill='#8884d8'
						dataKey='value'>
						{chartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
						))}
					</Pie>
					<Tooltip
						contentStyle={{
							background: '#fff',
							border: '1px solid #e5e7eb',
							borderRadius: '0.5rem',
						}}
					/>
					<Legend iconType='circle' iconSize={10} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	)
}
