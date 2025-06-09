'use client'

import { useState } from 'react'
import PanelLayout from '@/components/layout/PanelLayout'
import { Folder, File, Search, LoaderCircle, CheckCircle, XCircle } from 'lucide-react'

function FileTree({ items }) {
	if (!items || items.length === 0) {
		return null
	}

	return (
		<ul className='pl-6 space-y-2 mt-2'>
			{items.map(item => (
				<li key={item.id}>
					<div className='flex items-center gap-3 p-2 bg-gray-50 rounded-md'>
						{item.mimeType === 'application/vnd.google-apps.folder' ? (
							<Folder className='text-yellow-500 flex-shrink-0' />
						) : (
							<File className='text-gray-500 flex-shrink-0' />
						)}
						<a
							href={item.webViewLink}
							target='_blank'
							rel='noopener noreferrer'
							className='font-medium text-gray-700 hover:text-red-600 truncate'>
							{item.name}
						</a>
					</div>
					{item.children && <FileTree items={item.children} />}
				</li>
			))}
		</ul>
	)
}

export default function GoogleDriveTestPage() {
	const [folderUrl, setFolderUrl] = useState('')
	const [files, setFiles] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [auditResult, setAuditResult] = useState(null)

	const getFolderIdFromUrl = url => {
		const match = url.match(/folders\/([a-zA-Z0-9-_]+)/)
		return match ? match[1] : null
	}

	const handleFetchFiles = async () => {
		setError('')
		setFiles([])
		setAuditResult(null)
		const folderId = getFolderIdFromUrl(folderUrl)

		if (!folderId) {
			setError('Nieprawidłowy URL folderu na Dysku Google. Upewnij się, że link zawiera ".../folders/...".')
			return
		}

		setIsLoading(true)
		try {
			const res = await fetch(`/api/google-drive/list-files?folderId=${folderId}`)
			if (!res.ok) {
				const errorData = await res.json()
				throw new Error(errorData.details || 'Wystąpił błąd po stronie serwera.')
			}
			const data = await res.json()
			setFiles(data.files || [])
			setAuditResult(data.auditCreationResult || null)
		} catch (e) {
			setError(e.message)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<PanelLayout>
			<div className='space-y-6'>
				<div>
					<h2 className='text-3xl font-bold text-gray-800'>Przeglądarka Dysku Google</h2>
					<p className='text-gray-500 mt-1'>Wklej link do folderu na Dysku Google, aby wylistować jego zawartość.</p>
				</div>

				{/* Sekcja z inputem */}
				<div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100'>
					<div className='flex items-center gap-4'>
						<input
							type='url'
							value={folderUrl}
							onChange={e => setFolderUrl(e.target.value)}
							placeholder='https://drive.google.com/drive/folders/...'
							className='flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition'
						/>
						<button
							onClick={handleFetchFiles}
							disabled={isLoading}
							className='flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all shadow-md disabled:opacity-50'>
							{isLoading ? <LoaderCircle className='animate-spin' /> : <Search size={18} />}
							<span>Skanuj folder</span>
						</button>
					</div>
				</div>

				{/* Sekcja z wynikami */}
				{(files.length > 0 || error || isLoading || auditResult) && (
					<div className='space-y-4'>
						{/* Komunikat o wyniku tworzenia audytu */}
						{auditResult && !isLoading && (
							<div
								className={`flex items-start gap-4 p-4 rounded-lg border ${
									auditResult.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
								}`}>
								{auditResult.success ? (
									<CheckCircle className='w-6 h-6 text-green-600 mt-1' />
								) : (
									<XCircle className='w-6 h-6 text-red-600 mt-1' />
								)}
								<div>
									<h3 className={`font-bold ${auditResult.success ? 'text-green-800' : 'text-red-800'}`}>
										{auditResult.success ? 'Operacja zakończona powodzeniem' : 'Operacja zakończona niepowodzeniem'}
									</h3>
									<p className={`text-sm ${auditResult.success ? 'text-green-700' : 'text-red-700'}`}>
										{auditResult.message}
									</p>
								</div>
							</div>
						)}

						{/* Podgląd zawartości folderu */}
						<div className='bg-white p-6 rounded-2xl shadow-lg border border-gray-100'>
							{isLoading && (
								<div className='flex justify-center items-center h-24'>
									<LoaderCircle className='w-8 h-8 animate-spin text-red-600' />
								</div>
							)}
							{error && (
								<div className='text-red-600'>
									<h3 className='font-bold'>Błąd podglądu:</h3>
									<p>{error}</p>
								</div>
							)}
							{files.length > 0 && !isLoading && (
								<div>
									<h3 className='text-lg font-semibold text-gray-800 mb-2'>Podgląd zawartości folderu:</h3>
									<FileTree items={files} />
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</PanelLayout>
	)
}
