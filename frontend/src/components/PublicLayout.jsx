import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-soil-50">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
