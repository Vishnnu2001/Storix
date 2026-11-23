import {
  ArrowLeftIcon,
  FileTextIcon,
  ImageIcon,
  SaveIcon,
  TagIcon,
  TypeIcon,
  BoxesIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

function EditProductForm({ product, isPending, isError, onSubmit }) {
  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description,
    imageUrl: product.imageUrl,
    price: product.price ?? "",
    category: product.category ?? "",
    stock: product.stock ?? 0,
  });
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const stockNum = Number(formData.stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setErrorMsg("Stock quantity must be a non-negative whole number (0 or greater).");
      return;
    }

    onSubmit({
      ...formData,
      stock: stockNum,
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/profile" className="btn btn-ghost btn-sm gap-1 mb-4">
        <ArrowLeftIcon className="size-4" /> Back
      </Link>

      <div className="card bg-base-300">
        <div className="card-body">
          <h1 className="card-title">
            <SaveIcon className="size-5 text-primary" />
            Edit Product
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <label className="input input-bordered flex items-center gap-2 bg-base-200">
              <TypeIcon className="size-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Product title"
                className="grow"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </label>

            {/* CATEGORY & PRICE INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="input input-bordered flex items-center gap-2 bg-base-200">
                <TagIcon className="size-4 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Category"
                  className="grow"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </label>

              <label className="input input-bordered flex items-center gap-2 bg-base-200">
                <span className="text-xs font-semibold text-base-content/60">LKR</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  className="grow"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </label>
            </div>

            {/* STOCK QUANTITY INPUT */}
            <label className="input input-bordered flex items-center gap-2 bg-base-200">
              <BoxesIcon className="size-4 text-base-content/50" />
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Stock Quantity"
                className="grow"
                value={formData.stock}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (/^\d+$/.test(val) && parseInt(val, 10) >= 0)) {
                    setFormData({ ...formData, stock: val });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "e" || e.key === "-" || e.key === "+") {
                    e.preventDefault();
                  }
                }}
                required
              />
            </label>

            <label className="input input-bordered flex items-center gap-2 bg-base-200">
              <ImageIcon className="size-4 text-base-content/50" />
              <input
                type="url"
                placeholder="Image URL"
                className="grow"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
              />
            </label>

            {formData.imageUrl && (
              <div className="rounded-box overflow-hidden">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}

            <div className="form-control">
              <div className="flex items-start gap-2 p-3 rounded-box bg-base-200 border border-base-300">
                <FileTextIcon className="size-4 text-base-content/50 mt-1" />
                <textarea
                  placeholder="Description"
                  className="grow bg-transparent resize-none focus:outline-none min-h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </div>

            {(errorMsg || isError) && (
              <div role="alert" className="alert alert-error alert-sm">
                <span>{errorMsg || "Failed to update. Try again."}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
              {isPending ? <span className="loading loading-spinner" /> : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProductForm;
