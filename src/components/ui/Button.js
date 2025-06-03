// components/ui/Button.jsx
export default function Button({ children, variant = 'red', ...props }) {
	const base = 'px-4 py-2 rounded font-medium transition cursor-pointer'
	const variants = {
		red: 'bg-red-700 text-white hover:bg-red-800',
		gray: 'bg-gray-300 text-black hover:bg-gray-400',
		outline: 'border border-gray-500 text-gray-700 hover:bg-gray-100',
	}
	return (
		<button className={`${base} ${variants[variant]}`} {...props}>
			{children}
		</button>
	)
}
