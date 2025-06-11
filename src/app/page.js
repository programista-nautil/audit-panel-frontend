import { redirect } from 'next/navigation'

/**
 * Główna strona aplikacji, która natychmiast przekierowuje do panelu logowania.
 */
export default function HomePage() {
	redirect('/login')

	return null
}
