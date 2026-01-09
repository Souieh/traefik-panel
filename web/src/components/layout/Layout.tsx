import { Navbar } from "@/components/layout/Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50">
      <Navbar />
      <main className="w-full max-w-7xl mx-auto flex-1 flex flex-col overflow-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
