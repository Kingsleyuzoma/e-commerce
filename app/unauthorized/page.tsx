
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="max-w-md mx-auto text-center py-24 px-4 text-sm text-gray-800">
      <h1 className="text-2xl font-extrabold mb-2 text-rose-600">Access Denied</h1>
      <p className="text-gray-500 mb-6">You do not have permission to view this page.</p>
      <Link
        href="/"
        className="inline-block bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}


//unauthorized page 404