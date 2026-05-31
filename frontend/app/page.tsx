export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-400 mb-4">
          UrbanMind AI
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Smart City Infrastructure Intelligence Platform
        </p>
        <div className="flex gap-4 justify-center">
          <div className="bg-gray-800 rounded-xl p-6 w-48">
            <p className="text-3xl font-bold text-green-400">0</p>
            <p className="text-gray-400 text-sm mt-1">Potholes Detected</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 w-48">
            <p className="text-3xl font-bold text-yellow-400">0</p>
            <p className="text-gray-400 text-sm mt-1">Active Complaints</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 w-48">
            <p className="text-3xl font-bold text-red-400">0</p>
            <p className="text-gray-400 text-sm mt-1">High Risk Zones</p>
          </div>
        </div>
      </div>
    </main>
  )
}