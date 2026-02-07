export const metadata = {
    title: 'Sudoku Trainer — 無限レベル',
    description: '脳トレ・ソロ専用数独アプリ',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body className="min-h-screen text-neutral-900 bg-neutral-50">
                {children}
            </body>
        </html>
    )
}
