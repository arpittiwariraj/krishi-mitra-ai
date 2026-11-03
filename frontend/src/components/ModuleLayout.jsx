import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

export default function ModuleLayout({ children }) {
  return (
    <div className="min-h-screen bg-soil-50">
      <Navbar />
      <div className="container-page flex flex-col gap-6 py-6 lg:flex-row lg:gap-8 lg:py-8">
        <Sidebar />
        <main className="min-w-0 flex-1 animate-fadeUp">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
