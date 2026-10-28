import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { PackageIcon, SparklesIcon, SearchIcon, XIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import { SignInButton, useUser } from "@clerk/react";

function HomePage() {
  const { data: products, isLoading, error } = useProducts();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>Something went wrong. Please refresh the page.</span>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* HERO */}
      <div className="hero bg-linear-to-br from-base-300 via-base-200 to-base-300 rounded-box overflow-hidden">
        <div className="hero-content flex-col lg:flex-row-reverse gap-10 py-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110" />
            <img
              src="/image.png"
              alt="Creator"
              className="relative h-64 lg:h-72 rounded-2xl shadow-2xl"
            />
          </div>
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Share Your <span className="text-primary">Products</span>
            </h1>
            <p className="py-4 text-base-content/60">
              Upload, discover, and connect with creators.
            </p>
            <SignInButton mode="modal">
              <button className="btn btn-primary">
                <SparklesIcon className="size-4" />
                Start Selling
              </button>
            </SignInButton>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="max-w-2xl mx-auto w-full px-4">
        <form onSubmit={handleSearch}>
          <div className="bg-base-100 rounded-full shadow-xl border border-base-content/10 p-2 sm:p-2.5 flex items-center gap-3 transition-all duration-300 hover:shadow-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
            <div className="flex-1 flex flex-col justify-center pl-4 sm:pl-6 min-w-0">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-base-content/50 select-none">
                Search Products
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, category, or keyword..."
                className="bg-transparent border-none outline-none text-sm sm:text-base text-base-content font-medium placeholder:text-base-content/40 placeholder:font-normal w-full p-0 focus:ring-0"
              />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="btn btn-ghost btn-circle btn-xs sm:btn-sm text-base-content/50 hover:text-base-content shrink-0"
                aria-label="Clear search"
              >
                <XIcon className="size-4" />
              </button>
            )}

            <button
              type="submit"
              className="btn btn-circle bg-primary text-primary-content hover:bg-primary/90 border-none shadow-md shrink-0 size-11 sm:size-12 min-h-0 flex items-center justify-center transition-transform active:scale-95"
              aria-label="Search"
            >
              <SearchIcon className="size-5 sm:size-5.5 stroke-[2.2]" />
            </button>
          </div>
        </form>
      </div>

      {/* PRODUCTS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PackageIcon className="size-5 text-primary" />
            All Products
          </h2>
        </div>

        {!products || products.length === 0 ? (
          <div className="card bg-base-300">
            <div className="card-body items-center text-center py-16">
              <PackageIcon className="size-16 text-base-content/20" />
              <h3 className="card-title text-base-content/50">No products yet</h3>
              <p className="text-base-content/40 text-sm">Be the first to share something!</p>
              <Link to="/create" className="btn btn-primary btn-sm mt-2">
                Create Product
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage