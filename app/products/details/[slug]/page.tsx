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
            price: Number(data.price) || 0,
            salePercentage: Number(data.salePercentage) || 0,
            isNew: Boolean(data.isNew),
            isOnSale: Boolean(data.isOnSale),
            availableStock: Number(data.availableStock) || 0,
            tags: data.tags || [],
            variants: data.variants || []
          };

          setProduct(loadedProduct);

          // Default first option
          if (loadedProduct.variants.length > 0) {
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
      <div className="h-[60vh] flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading product...</p>
      </div>
    );
  }

  // ================= NOT FOUND =================
  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Product not found</h2>
        <button onClick={() => router.back()} className="mt-5 text-pink-600">
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
  const activeColor = product.variants.find(
    (variant) => variant.color === selectedColor
  );

  const activeSize = activeColor?.sizes.find(
    (item) => item.size === selectedSize
  );

  const currentStock = activeSize?.stock || 0;

  // ================= CART =================
  const handleAddToCart = () => {
    if (product.variants.length > 0 && (!selectedColor || !selectedSize)) {
      alert("Please select color and size");
      return;
    }

    addToCart({
      id: `${product.id}-${selectedColor}-${selectedSize}`,
      quantity,
      selectedColor,
      selectedSize,
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-6">
        <Link href="/">Home</Link>
        <span className="mx-2">/</span>
        <span>{product.category}</span>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* IMAGE */}
        <div className="rounded-xl overflow-hidden bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-[500px] object-cover"
          />
        </div>

        {/* DETAILS */}
        <div>
          <p className="text-sm uppercase text-pink-600 font-bold">
            {product.brand}
          </p>

          <h1 className="text-3xl font-bold mt-2">{product.name}</h1>

          <div className="mt-4">
            {product.isOnSale ? (
              <div>
                <span className="text-3xl font-bold text-pink-600">
                  ${finalPrice.toFixed(2)}
                </span>
                <span className="ml-3 line-through text-gray-400">
                  ${product.price}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold">${product.price}</span>
            )}
          </div>

          <p className="mt-5 text-gray-600">{product.description}</p>

          {/* TAGS */}
          <div className="flex gap-2 mt-5">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 px-3 py-1 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* COLORS */}
          <div className="mt-8">
            <h3 className="font-bold mb-3">
              Color:
              <span className="text-pink-600 ml-2">{selectedColor}</span>
            </h3>

            <div className="flex gap-3">
              {product.variants.map((variant) => (
                <button
                  key={variant.color}
                  onClick={() => {
                    setSelectedColor(variant.color);
                    setSelectedSize(variant.sizes[0]?.size);
                  }}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedColor === variant.color
                      ? "border-pink-600 bg-pink-50"
                      : "border-gray-300"
                  }`}
                >
                  {variant.color}
                </button>
              ))}
            </div>
          </div>

          {/* SIZE */}
          <div className="mt-6">
            <h3 className="font-bold mb-3">Size</h3>
            <div className="flex gap-3 flex-wrap">
              {activeColor?.sizes.map((size) => (
                <button
                  key={String(size.size)}
                  disabled={size.stock === 0}
                  onClick={() => {
                    setSelectedSize(size.size);
                    setQuantity(1);
                  }}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedSize === size.size
                      ? "bg-pink-600 text-white"
                      : "bg-white"
                  } ${size.stock === 0 ? "opacity-40" : ""}`}
                >
                  {size.size} ({size.stock})
                </button>
              ))}
            </div>
          </div>

          {/* QUANTITY */}
          <div className="mt-8 flex items-center gap-5">
            <button
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => q - 1)}
              className="border px-3 py-1"
            >
              -
            </button>

            <span>{quantity}</span>

            <button
              disabled={quantity >= currentStock}
              onClick={() => setQuantity((q) => q + 1)}
              className="border px-3 py-1"
            >
              +
            </button>

            <span className="text-sm text-gray-500">Stock: {currentStock}</span>
          </div>

          <button
            disabled={currentStock === 0}
            onClick={handleAddToCart}
            className="mt-8 w-full bg-pink-600 text-white py-4 rounded-xl font-bold disabled:bg-gray-300"
          >
            {currentStock === 0 ? "OUT OF STOCK" : "ADD TO CART"}
          </button>
        </div>
      </div>
    </div>
  );
}