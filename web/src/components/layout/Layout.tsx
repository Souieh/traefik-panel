import { Navbar } from "@/components/layout/Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-dvh bg-gray-50 overflow-x-hidden flex flex-col ">
      <div>
        <Navbar />
      </div>
      <div
        className="
          w-full max-w-7xl mx-auto
          flex flex-col flex-1
          py-8 px-4 sm:px-6 lg:px-8 mt-4 md:mt-8
          bg-white shadow-lg
          border-t-2 border-neutral-950
        "
      >
        <main className=" w-full  ">
          <Outlet />
        </main>
      </div>
      <footer>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Traefik Panel. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
