import ManageUsers from "@/components/users/ManageUsers";

export default function AdminDashboard() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Manage Admins
        </h2>
        <p className="text-gray-600">
          Manage your admin users and their roles.
        </p>
      </div>

      <ManageUsers />
    </main >
  );
}
