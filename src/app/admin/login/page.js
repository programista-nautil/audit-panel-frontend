export default function AdminLoginPage() {
	return (
		<div className='flex items-center justify-center h-screen bg-gray-100'>
			<form className='bg-white shadow-md rounded p-8 w-full max-w-md'>
				<h2 className='text-2xl font-bold mb-6'>Logowanie Admina</h2>
				<input className='w-full mb-4 p-2 border rounded' type='email' placeholder='Email' />
				<input className='w-full mb-6 p-2 border rounded' type='password' placeholder='Hasło' />
				<button type='submit' className='w-full bg-red-600 text-white py-2 rounded hover:bg-red-700'>
					Zaloguj się
				</button>
			</form>
		</div>
	)
}
