import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { useSearchProducts, useProducts } from "../hooks/useProducts";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  PackageIcon,
  SearchIcon,
  XIcon,
  ArrowLeftIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

function SearchResultPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSearchInput(query);
  }

  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [prevParams, setPrevParams] = useState({ min: minPriceParam, max: maxPriceParam });
  if (minPriceParam !== prevParams.min || maxPriceParam !== prevParams.max) {
    setPrevParams({ min: minPriceParam, max: maxPriceParam });
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
  }

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Click outside and escape key listener for filter popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterOpen]);

  // Fetch products: if search query exists, search; otherwise fetch all if price filter is applied
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useSearchProducts(query);

  const {
    data: allProducts,
    isLoading: isAllLoading,
    error: allError,
  } = useProducts();

  const hasActivePriceFilter = Boolean(
    (minPrice.trim() !== "" && !isNaN(Number(minPrice))) ||
      (maxPrice.trim() !== "" && !isNaN(Number(maxPrice)))
  );

  const isPriceRangeInvalid = Boolean(
    minPrice.trim() !== "" &&
      maxPrice.trim() !== "" &&
      !isNaN(Number(minPrice)) &&
      !isNaN(Number(maxPrice)) &&
      Number(minPrice) > Number(maxPrice)
  );

  const rawProducts = query.trim()
    ? searchResults
    : hasActivePriceFilter
    ? allProducts
    : null;
  const isLoading = query.trim()
    ? isSearchLoading
    : hasActivePriceFilter
    ? isAllLoading
    : false;
  const error = query.trim()
    ? searchError
    : hasActivePriceFilter
    ? allError
    : null;

  // Filter products by min & max price
  const filteredProducts = (rawProducts || []).filter((product) => {
    const price = parseFloat(product.price);
    if (isNaN(price)) return true;

    if (minPrice.trim() !== "" && !isNaN(Number(minPrice))) {
      if (price < Number(minPrice)) return false;
    }

    if (maxPrice.trim() !== "" && !isNaN(Number(maxPrice))) {
      if (price > Number(maxPrice)) return false;
    }

    return true;
  });

  const updatePriceParams = (newMin, newMax) => {
    const params = new URLSearchParams(searchParams);
    if (newMin !== "" && !isNaN(Number(newMin))) {
      params.set("minPrice", newMin);
    } else {
      params.delete("minPrice");
    }
    if (newMax !== "" && !isNaN(Number(newMax))) {
      params.set("maxPrice", newMax);
    } else {
      params.delete("maxPrice");
    }
    setSearchParams(params);
  };

  const handleApplyFilter = () => {
    if (isPriceRangeInvalid) return;
    updatePriceParams(minPrice.trim(), maxPrice.trim());
    setIsFilterOpen(false);
  };

  const handleClearPrice = () => {
    setMinPrice("");
    setMaxPrice("");
    updatePriceParams("", "");
  };

  const handlePresetClick = (presetMin, presetMax) => {
    if (minPrice === presetMin && maxPrice === presetMax) {
      setMinPrice("");
      setMaxPrice("");
      updatePriceParams("", "");
    } else {
      setMinPrice(presetMin);
      setMaxPrice(presetMax);
      updatePriceParams(presetMin, presetMax);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (isPriceRangeInvalid) return;
    const params = new URLSearchParams();
    if (searchInput.trim()) {
      params.set("q", searchInput.trim());
    }
    if (minPrice.trim() !== "" && !isNaN(Number(minPrice))) {
      params.set("minPrice", minPrice.trim());
    }
    if (maxPrice.trim() !== "" && !isNaN(Number(maxPrice))) {
      params.set("maxPrice", maxPrice.trim());
    }
    setSearchParams(params);
    setIsFilterOpen(false);
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
          {query ? (
            <p className="text-sm text-base-content/60 mt-0.5">
              Showing results for <span className="font-semibold text-primary">"{query}"</span>
            </p>
          ) : hasActivePriceFilter ? (
            <p className="text-sm text-base-content/60 mt-0.5">
              Showing products filtered by price
            </p>
          ) : null}
        </div>
      </div>

      {/* SEARCH BAR (Matching Pill Style) WITH PRICE FILTER */}
      <div className="relative max-w-2xl mx-auto w-full" ref={filterRef}>
        <form onSubmit={handleSearch}>
          <div className="bg-base-100 rounded-full shadow-xl border border-base-content/10 p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 transition-all duration-300 hover:shadow-2xl focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
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

            {/* PRICE FILTER TOGGLE (In the right side of the search bar) */}
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`relative btn btn-circle shrink-0 size-11 sm:size-12 min-h-0 border-none transition-all ${
                hasActivePriceFilter
                  ? "bg-primary text-primary-content shadow-md hover:bg-primary/90"
                  : isFilterOpen
                  ? "bg-base-300 text-base-content"
                  : "btn-ghost text-base-content/60 hover:text-base-content hover:bg-base-200"
              }`}
              title="Filter by price"
              aria-label="Filter by price"
              aria-expanded={isFilterOpen}
            >
              <SlidersHorizontalIcon className="size-5" />
              {hasActivePriceFilter && (
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-3 bg-secondary"></span>
                </span>
              )}
            </button>

            {/* SEARCH BUTTON */}
            <button
              type="submit"
              className="btn btn-circle bg-primary text-primary-content hover:bg-primary/90 border-none shadow-md shrink-0 size-11 sm:size-12 min-h-0 flex items-center justify-center transition-transform active:scale-95"
              aria-label="Search"
            >
              <SearchIcon className="size-5 sm:size-5.5 stroke-[2.2]" />
            </button>
          </div>
        </form>

        {/* PRICE FILTER DROPDOWN POPOVER */}
        {isFilterOpen && (
          <div className="absolute right-0 top-full mt-3 w-full sm:w-96 bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 p-5 z-50 text-base-content animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-base-content/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontalIcon className="size-4 text-primary" />
                <h3 className="font-bold text-sm">Filter by Price</h3>
              </div>
              {hasActivePriceFilter && (
                <button
                  type="button"
                  onClick={handleClearPrice}
                  className="text-xs text-primary font-medium hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Min and Max Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-4 pb-2">
              <div>
                <label className="text-xs font-semibold text-base-content/70 mb-1.5 block">
                  Min Price
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-base-content/40 select-none">
                    LKR
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                    placeholder="0"
                    className="input input-sm input-bordered w-full pl-12 text-sm font-medium focus:input-primary bg-base-200/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-base-content/70 mb-1.5 block">
                  Max Price
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-base-content/40 select-none">
                    LKR
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                    placeholder="No limit"
                    className="input input-sm input-bordered w-full pl-12 text-sm font-medium focus:input-primary bg-base-200/50"
                  />
                </div>
              </div>
            </div>

            {/* Validation notice */}
            {isPriceRangeInvalid && (
              <p className="text-[11px] text-error font-medium mt-1 mb-2">
                Minimum price cannot exceed maximum price.
              </p>
            )}

            {/* Quick Price Range Presets */}
            <div className="pt-2 pb-3">
              <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block mb-2">
                Quick Ranges
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "Under 1,000", min: "", max: "1000" },
                  { label: "1,000 - 5,000", min: "1000", max: "5000" },
                  { label: "5,000 - 15,000", min: "5000", max: "15000" },
                  { label: "15,000+", min: "15000", max: "" },
                ].map((preset) => {
                  const isSelected =
                    minPrice === preset.min && maxPrice === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetClick(preset.min, preset.max)}
                      className={`btn btn-xs rounded-lg transition-all ${
                        isSelected
                          ? "btn-primary text-primary-content"
                          : "btn-ghost bg-base-200/70 hover:bg-base-200 text-base-content/70"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Popover Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-base-content/10">
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={isPriceRangeInvalid}
                className="btn btn-primary btn-sm px-5"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE PRICE FILTER BADGE */}
      {hasActivePriceFilter && (
        <div className="flex flex-wrap items-center justify-center gap-2 -mt-4">
          <div className="inline-flex items-center gap-2 bg-base-200/80 backdrop-blur-xs text-base-content text-xs font-medium px-3.5 py-1.5 rounded-full border border-base-content/10 shadow-xs">
            <SlidersHorizontalIcon className="size-3.5 text-primary shrink-0" />
            <span>
              Price:{" "}
              <span className="font-bold text-primary">
                {minPrice && maxPrice
                  ? `LKR ${Number(minPrice).toLocaleString()} - LKR ${Number(maxPrice).toLocaleString()}`
                  : minPrice
                  ? `Min LKR ${Number(minPrice).toLocaleString()}`
                  : `Max LKR ${Number(maxPrice).toLocaleString()}`}
              </span>
            </span>
            <button
              type="button"
              onClick={handleClearPrice}
              className="text-base-content/40 hover:text-base-content hover:bg-base-300 rounded-full p-0.5 transition-colors ml-0.5 cursor-pointer"
              aria-label="Remove price filter"
              title="Remove price filter"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleClearPrice}
            className="text-xs text-base-content/50 hover:text-primary transition-colors underline cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      <div>
        {isLoading && <LoadingSpinner />}

        {error && (
          <div role="alert" className="alert alert-error">
            <span>Failed to load search results. Please try again.</span>
          </div>
        )}

        {!isLoading && !error && !query.trim() && !hasActivePriceFilter && (
          <div className="card bg-base-300">
            <div className="card-body items-center text-center py-16">
              <SearchIcon className="size-16 text-base-content/20" />
              <h3 className="card-title text-base-content/50">Type something to search</h3>
              <p className="text-base-content/40 text-sm">
                Search for products by title or category, or set a price filter above.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && rawProducts && rawProducts.length === 0 && (
          <div className="card bg-base-300">
            <div className="card-body items-center text-center py-16">
              <PackageIcon className="size-16 text-base-content/20" />
              <h3 className="card-title text-base-content/50">No products found</h3>
              <p className="text-base-content/40 text-sm">
                {query.trim() ? (
                  <>
                    No products matched{" "}
                    <span className="font-semibold text-base-content/70">"{query}"</span> in title
                    or category.
                  </>
                ) : (
                  "No products available."
                )}
              </p>
              <Link to="/" className="btn btn-primary btn-sm mt-3">
                Explore All Products
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && rawProducts && rawProducts.length > 0 && filteredProducts.length === 0 && (
          <div className="card bg-base-300">
            <div className="card-body items-center text-center py-16">
              <SlidersHorizontalIcon className="size-16 text-base-content/20" />
              <h3 className="card-title text-base-content/50">No products in this price range</h3>
              <p className="text-base-content/40 text-sm">
                No products matched your criteria between{" "}
                <span className="font-semibold text-base-content/70">
                  {minPrice ? `LKR ${Number(minPrice).toLocaleString()}` : "LKR 0"}
                </span>{" "}
                and{" "}
                <span className="font-semibold text-base-content/70">
                  {maxPrice ? `LKR ${Number(maxPrice).toLocaleString()}` : "above"}
                </span>.
              </p>
              <button
                type="button"
                onClick={handleClearPrice}
                className="btn btn-primary btn-sm mt-3 cursor-pointer"
              >
                Clear Price Filter
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PackageIcon className="size-5 text-primary" />
                Products ({filteredProducts.length}
                {hasActivePriceFilter && rawProducts && rawProducts.length !== filteredProducts.length
                  ? ` of ${rawProducts.length}`
                  : ""}
                )
              </h2>
              {hasActivePriceFilter && (
                <button
                  type="button"
                  onClick={handleClearPrice}
                  className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
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
