import Navbar from "./components/Navbar"
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import ProfilePage from "./pages/ProfilePage";
import CreatePage from "./pages/CreatePage";
import EditProductPage from "./pages/EditProductPage";
import SearchResultPage from "./pages/SearchResultPage";
import Wishlist from "./pages/Wishlist";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import SellerOrdersPage from "./pages/SellerOrdersPage";
import useAuthReq from "./hooks/useAuthReq";
import useUserSync from "./hooks/useUserSync";


function App() {
  const { isClerkLoaded, isSignedIn } = useAuthReq();
  useUserSync();

  if (!isClerkLoaded) return null;


  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={isSignedIn ? <CartPage /> : <Navigate to={"/"} />} />
          <Route path="/checkout" element={isSignedIn ? <CheckoutPage /> : <Navigate to={"/"} />} />
          <Route path="/payment/success" element={isSignedIn ? <PaymentSuccessPage /> : <Navigate to={"/"} />} />
          <Route path="/payment/cancel" element={isSignedIn ? <PaymentCancelPage /> : <Navigate to={"/"} />} />
          <Route path="/orders" element={isSignedIn ? <OrderHistoryPage /> : <Navigate to={"/"} />} />
          <Route path="/orders/:id" element={isSignedIn ? <OrderDetailPage /> : <Navigate to={"/"} />} />
          <Route path="/seller/orders" element={isSignedIn ? <SellerOrdersPage /> : <Navigate to={"/"} />} />
          <Route path="/wishlist" element={isSignedIn ? <Wishlist /> : <Navigate to={"/"} />} />
          <Route path="/profile" element={isSignedIn ? <ProfilePage /> : <Navigate to={"/"} />} />
          <Route path="/create" element={isSignedIn ? <CreatePage /> : <Navigate to={"/"} />} />
          <Route
            path="/edit/:id"
            element={isSignedIn ? <EditProductPage /> : <Navigate to={"/"} />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
