import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import { useSearchProducts } from "../hooks/useProducts";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { PackageIcon, SearchIcon, XIcon, ArrowLeftIcon } from "lucide-react";

function SearchResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);

  const { data: products, isLoading, error } = useSearchProducts(query);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Search Results</h1>
          {query && (
            <p className="text-sm text-base-content/60 mt-0.5">
              Showing results for <span className="font-semibold text-primary">"{query}"</span>
            </p>
          )}
        </div>
      </div>

      {/* SEARCH BAR (Matching Pill Style) */}
      <div className="max-w-2xl mx-auto w-full">
        <form onSubmit={handleSearch}>
          <div className="bg-base-100 rounded-full shadow-xl border border-base-content/10 p-2 sm:p-2.5 flex items-center gap-3 transition-all duration-300 hover:shadow-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
            <div className="flex-1 flex flex-col justify-center pl-4 sm:pl-6 min-w-0">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-base-content/50 select-none">
                Search Products
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title or category..."
                className="bg-transparent border-none outline-none text-sm sm:text-base text-base-content font-medium placeholder:text-base-content/40 placeholder:font-normal w-full p-0 focus:ring-0"
              />
            </div>

            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
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

      {/* RESULTS DISPLAY */}
      <div>
        {isLoading && <LoadingSpinner />}

        {error && (
          <div role="alert" className="alert alert-error">
            <span>Failed to load search results. Please try again.</span>
          </div>
        )}

        {!isLoading && !error && !query.trim() && (
          <div className="card bg-base-300">
            <div className="card-body items-center text-center py-16">
              <SearchIcon className="size-16 text-base-content/20" />
              <h3 className="card-title text-base-content/50">Type something to search</h3>
              <p className="text-base-content/40 text-sm">
                Search for products by title or category above.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && query.trim() && products && products.length === 0 && (
          <div className="card bg-base-300">
            <div className="card-body items-center text-center py-16">
              <PackageIcon className="size-16 text-base-content/20" />
              <h3 className="card-title text-base-content/50">No products found</h3>
              <p className="text-base-content/40 text-sm">
                No products matched <span className="font-semibold text-base-content/70">"{query}"</span> in title or category.
              </p>
              <Link to="/" className="btn btn-primary btn-sm mt-3">
                Explore All Products
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && products && products.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PackageIcon className="size-5 text-primary" />
                Products ({products.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResultPage;
