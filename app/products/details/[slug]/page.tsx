
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Swapped doc/getDoc for collection query imports
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useCart } from "@/Context/CartContext";

// ================= TYPES =================
interface SizeVariant {
  size: string | number;
  stock: number;
}

interface ColorVariant {
  color: string;
  sizes: SizeVariant[];
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  imageUrl: string;
  subImages?: string[]; // Added: support for 4 to 6 alternative perspective angles
  price: number;
  salePercentage: number;
  isNew: boolean;
  isOnSale: boolean;
  availableStock: number;
  tags: string[];
  variants: ColorVariant[];
}

// ================= PAGE PROPS =================
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// ================= PAGE =================
export default function ProductDetailsPage(props: PageProps) {
  const params = use(props.params);
  const slug = params.slug;
  const router = useRouter();
  const { addToCart } = useCart();

  // ================= STATES =================
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState<string | number>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(""); // Track selected gallery photo

  // ================= FETCH PRODUCT =================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productsRef = collection(db, "products");

        // Decode the slug to handle spaces/special characters (e.g. "Nike%20Shoes" -> "Nike Shoes")
        const decodedName = decodeURIComponent(slug);

        console.log("1. WHAT THE URL IS PASSING:", decodedName);
        const allDocs = await getDocs(productsRef);
        console.log("2. EXACT NAMES IN FIRESTORE:", allDocs.docs.map(d => d.data().name));

        // Query the products collection where the product "name" field matches the decoded URL slug
        const q = query(productsRef, where("name", "==", decodedName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Grab the first matched product document
          const snapshot = querySnapshot.docs[0];
          const data = snapshot.data();

          const loadedProduct: Product = {
            id: snapshot.id, // Keeps your Document ID intact for the cart to function perfectly!
            name: data.name || "",
            brand: data.brand || "",
            category: data.category || "",
            description: data.description || "",
            imageUrl: data.imageUrl || "",
            subImages: data.subImages || [], // Load the sub-images array
            price: Number(data.price) || 0,
            salePercentage: Number(data.salePercentage) || 0,
            isNew: Boolean(data.isNew),
            isOnSale: Boolean(data.isOnSale),
            availableStock: Number(data.availableStock) || 0,
            tags: data.tags || [],
            variants: data.variants || []
          };

          setProduct(loadedProduct);
          setActiveImage(loadedProduct.imageUrl); // Initialize main view photo

          // Default first option
          if (loadedProduct.variants && loadedProduct.variants.length > 0) {
            const firstVariant = loadedProduct.variants[0];
            setSelectedColor(firstVariant.color);

            if (firstVariant.sizes.length > 0) {
              setSelectedSize(firstVariant.sizes[0].size);
            }
          }
        } else {
          console.log("Product not found matching name:", decodedName);
          setProduct(null);
        }
      } catch (error) {
        console.log("Error fetching product", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-[#FAF9F6]">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[#A8A29E]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B23A2E]" />
          Loading product
        </p>
      </div>
    );
  }

  // ================= NOT FOUND =================
  if (!product) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 bg-[#FAF9F6] text-center">
        <h2 className="font-serif text-2xl font-medium text-[#1C1917]">Product not found</h2>
        <p className="text-sm text-[#78716C]">We couldn't find what you're looking for.</p>
        <button
          onClick={() => router.back()}
          className="mt-2 rounded-full border border-[#1C1917]/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#1C1917] transition-colors hover:bg-[#1C1917] hover:text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ================= PRICE =================
  const finalPrice = product.isOnSale
    ? product.price - (product.price * product.salePercentage) / 100
    : product.price;

  // ================= SELECTED VARIANT =================
  const hasVariants = product.variants && product.variants.length > 0;

  // Safe checks: Only look up color and size variables if variants exist
  const activeColor = hasVariants
    ? product.variants.find((variant) => variant.color === selectedColor)
    : undefined;

  const activeSize = activeColor
    ? activeColor.sizes.find((item) => item.size === selectedSize)
    : undefined;

  // If the product has variants, read the active size stock. Otherwise, read the base stock
  const currentStock = hasVariants ? (activeSize?.stock || 0) : product.availableStock;

  // ================= CART =================
  const handleAddToCart = () => {
    if (hasVariants && (!selectedColor || !selectedSize)) {
      alert("Please select color and size");
      return;
    }

    addToCart({
      id: hasVariants ? `${product.id}-${selectedColor}-${selectedSize}` : `${product.id}-default`,
      quantity,
      selectedColor: hasVariants ? selectedColor : "",
      selectedSize: hasVariants ? selectedSize : "",
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        salePrice: product.isOnSale ? finalPrice : undefined,
        imageUrl: product.imageUrl,
      },
    });

    alert("Added to cart");
  };

  // Compile the interactive thumbnail images
  const allImages = [
    product.imageUrl,
    ...(product.subImages || [])
  ].filter(Boolean);

  const displayImage = activeImage || product.imageUrl;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#A8A29E]">
          <Link href="/" className="transition-colors hover:text-[#1C1917]">Home</Link>
          <span className="text-[#D6D3CD]">/</span>
          <span>{product.category}</span>
          <span className="text-[#D6D3CD]">/</span>
          <span className="text-[#1C1917]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* IMAGE SECTION with Dynamic Interactive Thumbnails */}
          <div className="flex flex-col gap-3">
            {/* Main Large Image Display */}
            <div className="overflow-hidden rounded-2xl border border-[#E7E4DC] bg-[#F1EFE8]">
              <img
                src={displayImage}
                alt={product.name}
                className="h-125 w-full object-cover transition-all duration-300"
              />
            </div>

            {/* Alternative Angle Thumbnails Container (Appears if alternative sub-images exist) */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.slice(0, 6).map((imgUrl, index) => {
                  const isActive = displayImage === imgUrl;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImage(imgUrl)}
                      className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-[#F1EFE8] transition-all ${
                        isActive
                          ? "border-[#1C1917] ring-1 ring-[#1C1917]/20"
                          : "border-[#E7E4DC] hover:border-[#1C1917]/40"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {imgUrl === product.imageUrl && (
                        <span className="absolute bottom-0.5 right-0.5 origin-bottom-right scale-75 rounded bg-[#1C1917] px-1 py-px text-[7px] font-bold uppercase tracking-wide text-white">
                          Cover
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B23A2E]">
              {product.brand}
            </p>

            <h1 className="mt-2 font-serif text-3xl font-medium leading-tight tracking-tight text-[#1C1917]">
              {product.name}
            </h1>

            {/* Price tag — swing-tag styling, punched hole and all */}
            <div className="relative mt-5 inline-block">
              <span className="pointer-events-none absolute -left-[3px] top-1/2 z-10 h-[7px] w-[7px] -translate-y-1/2 rounded-full border border-[#E7E4DC] bg-[#FAF9F6]" />
              <div className="flex items-center gap-3 rounded-r-md rounded-l-[3px] border border-dashed border-[#D6D3CD] bg-white py-1.5 pl-4 pr-4">
                {product.isOnSale ? (
                  <>
                    <span className="font-serif text-2xl font-semibold text-[#B23A2E]">
                      ${finalPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-[#A8A29E] line-through">
                      ${product.price}
                    </span>
                  </>
                ) : (
                  <span className="font-serif text-2xl font-semibold text-[#1C1917]">
                    ${product.price}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-[#78716C]">
              {product.description}
            </p>

            {/* TAGS */}
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#F1EFE8] px-3 py-1 text-[11px] font-medium text-[#78716C]"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* COLORS */}
            {hasVariants && (
              <div className="mt-8">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8A29E]">
                  Color <span className="ml-1 normal-case tracking-normal text-[#1C1917]">{selectedColor}</span>
                </h3>

                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.color}
                      onClick={() => {
                        setSelectedColor(variant.color);
                        setSelectedSize(variant.sizes[0]?.size);
                      }}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium capitalize transition-all ${
                        selectedColor === variant.color
                          ? "border-[#1C1917] bg-[#1C1917] text-white"
                          : "border-[#E7E4DC] bg-white text-[#57534E] hover:border-[#1C1917]/40"
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: variant.color.toLowerCase() }}
                      />
                      {variant.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SIZE (only show if variant exists) */}
            {activeColor && activeColor.sizes.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8A29E]">
                  Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeColor.sizes.map((size) => (
                    <button
                      key={String(size.size)}
                      disabled={size.stock === 0}
                      onClick={() => {
                        setSelectedSize(size.size);
                        setQuantity(1);
                      }}
                      className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                        selectedSize === size.size
                          ? "border-[#1C1917] bg-[#1C1917] text-white"
                          : "border-[#E7E4DC] bg-white text-[#1C1917] hover:border-[#1C1917]/40"
                      } ${size.stock === 0 ? "cursor-not-allowed opacity-40" : ""}`}
                    >
                      {size.size} <span className="opacity-60">({size.stock})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QUANTITY */}
            <div className="mt-8 flex items-center gap-5 border-t border-dashed border-[#E7E4DC] pt-6">
              <div className="flex items-center overflow-hidden rounded-full border border-[#E7E4DC]">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => q - 1)}
                  className="px-3.5 py-1.5 text-sm font-medium text-[#1C1917] transition-colors hover:bg-[#F1EFE8] disabled:cursor-not-allowed disabled:text-[#D6D3CD]"
                >
                  −
                </button>

                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>

                <button
                  disabled={quantity >= currentStock}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-1.5 text-sm font-medium text-[#1C1917] transition-colors hover:bg-[#F1EFE8] disabled:cursor-not-allowed disabled:text-[#D6D3CD]"
                >
                  +
                </button>
              </div>

              <span className="text-xs uppercase tracking-[0.1em] text-[#A8A29E]">
                Stock: <span className="font-semibold text-[#1C1917]">{currentStock}</span>
              </span>
            </div>

            <button
              disabled={currentStock === 0}
              onClick={handleAddToCart}
              className="mt-8 w-full cursor-pointer rounded-full bg-[#1C1917] py-4 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#B23A2E] disabled:cursor-not-allowed disabled:bg-[#E7E4DC] disabled:text-[#A8A29E]"
            >
              {currentStock === 0 ? "Out of Stock" : "Add to Bag"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
