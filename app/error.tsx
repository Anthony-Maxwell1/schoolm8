export default function ErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
                <p className="text-gray-600 mb-6">An unexpected error has occurred.</p>
                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                >
                    Go Home
                </a>

                <p className="text-gray-400 mt-4 text-sm">
                    Note that this page isn't customizable. This is to avoid error loops from
                    loading the resource causing the error. Thanks for your understanding.
                </p>
            </div>
        </div>
    );
}
