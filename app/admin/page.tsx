
"use client";

export default function AdminDashboardHome() {
  // 📊 Mock data for the dashboard metrics
  const stats = [
    { name: "Total Revenue", value: "$1,000,000", icon: "💰", color: "bg-green-50 text-green-700" },
    { name: "Registered Users", value: "10,000", icon: "👥", color: "bg-blue-50 text-blue-700" },
    { name: "Total Orders", value: "1,240", icon: "📦", color: "bg-purple-50 text-purple-700" },
    { name: "Site Visitors", value: "45,320", icon: "🌐", color: "bg-pink-50 text-pink-700" },
  ];

  // ⚠️ Mock data for low stock items
  const lowStockProducts = [
    { id: 1, name: "Luxury Bone Straight Wig", category: "Wigs & Hair", stock: 2 },
    { id: 2, name: "Matte Liquid Lipstick - Red", category: "Makeup", stock: 0 },
  ];

  return (
    <div className="space-y-8">
      {/* 👋 Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back, Admin!</h1>
        <p className="text-sm text-gray-500 mt-1">Here is an overview of your store performance today.</p>
      </div>

      {/* 📊 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
            </div>
            <div className={`text-2xl p-3 rounded-full ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ⚠️ Low Stock Alerts Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⚠️</span>
          <h2 className="text-lg font-bold text-gray-800">Inventory Alerts (Low Stock)</h2>
        </div>
        
        {lowStockProducts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-700">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.category}</p>
                </div>
                <div>
                  {product.stock === 0 ? (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                      Only {product.stock} left
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">All products are well stocked! 🎉</p>
        )}
      </div>
    </div>
  );
}