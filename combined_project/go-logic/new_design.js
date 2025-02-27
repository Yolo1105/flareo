import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";

const categories = [
  { name: "Watches", color: "from-blue-500 to-blue-700" },
  { name: "Jewelry", color: "from-blue-400 to-blue-600" },
  { name: "Accessories", color: "from-blue-600 to-blue-800" },
  { name: "Apparel", color: "from-blue-300 to-blue-500" },
]

export default function Categories() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-500 opacity-10 transform rotate-45"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-700 opacity-10 transform -rotate-12"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-bold mb-12 text-center text-white">
          <span className="inline-block transform hover:-rotate-3 transition-transform duration-300">
            Explore Categories
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <Link key={category.name} href={`/category/${category.name.toLowerCase()}`}>
              <div
                className={`h-40 bg-gradient-to-br ${category.color} rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center overflow-hidden group`}
              >
                <div className="absolute inset-0 opacity-20 transition-opacity duration-300 group-hover:opacity-30">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute bg-white ${
                        i === 0
                          ? "w-20 h-20 top-4 left-4 rotate-45"
                          : i === 1
                            ? "w-16 h-16 bottom-4 right-4 -rotate-12"
                            : "w-24 h-24 bottom-8 left-8 rotate-30"
                      }`}
                    ></div>
                  ))}
                </div>
                <h3 className="text-2xl font-bold text-white z-10 transform group-hover:scale-110 transition-transform duration-300">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}



const products = [
  { id: 1, name: "Ocean Blue Watch", price: "$199.99", image: "/placeholder.svg?height=300&width=300" },
  { id: 2, name: "Azure Necklace", price: "$299.99", image: "/placeholder.svg?height=300&width=300" },
  { id: 3, name: "Sapphire Sunglasses", price: "$89.99", image: "/placeholder.svg?height=300&width=300" },
  { id: 4, name: "Indigo Scarf", price: "$49.99", image: "/placeholder.svg?height=300&width=300" },
]

export default function FeaturedProducts() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-700 opacity-10 transform rotate-45"></div>
        <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-blue-500 opacity-10 transform -rotate-12"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-bold mb-12 text-center text-white">
          <span className="inline-block transform hover:rotate-3 transition-transform duration-300">
            Featured Products
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <div key={product.id} className="group relative">
              <div
                className={`absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-75 transform transition-transform duration-300 ${index % 2 === 0 ? "rotate-3 group-hover:rotate-6" : "-rotate-3 group-hover:-rotate-6"}`}
              ></div>
              <div className="bg-blue-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105 relative z-10">
                <div className="relative">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent opacity-60"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-white">{product.name}</h3>
                  <p className="text-cyan-300 mb-4">{product.price}</p>
                  <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-blue-900 font-bold py-2 px-4 rounded-full transition-colors duration-300 transform hover:scale-105">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-blue-200 py-16 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-800 opacity-10 transform rotate-45"></div>
        <div className="absolute top-0 right-0 w-1/4 h-1/4 bg-blue-700 opacity-10 transform -rotate-12"></div>
        <div className="absolute top-1/2 left-1/4 w-1/5 h-1/5 bg-blue-600 opacity-10 transform -translate-y-1/2 rotate-30"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-white">Blue Ocean Shop</h3>
            <p className="text-blue-300 mb-4">
              Dive into style with our curated collection of ocean-inspired products.
            </p>
            <div className="flex space-x-4">
              {["Facebook", "Instagram", "Twitter", "Pinterest"].map((social) => (
                <a key={social} href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              {["Terms of Service", "Privacy Policy", "Shipping Information", "Returns & Exchanges"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-blue-300 hover:text-cyan-300 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Contact Us</h3>
            <p className="text-blue-300 mb-2">1234 Ocean Avenue, Seaside City, 12345</p>
            <p className="text-blue-300 mb-2">Phone: (123) 456-7890</p>
            <p className="text-blue-300 mb-2">Email: info@blueoceanshop.com</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-blue-800 text-center text-blue-400">
          <p>&copy; 2025 Blue Ocean Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-blue-900 bg-opacity-80 backdrop-blur-md text-blue-100 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-cyan-300 hover:text-cyan-200 transition-colors">
          <span className="inline-block transform -rotate-12">Blue</span>
          <span className="inline-block transform rotate-12 ml-1">Ocean</span>
        </Link>
        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            {["Home", "Products", "About", "Contact"].map((item) => (
              <li key={item} className="relative group">
                <Link href={`/${item.toLowerCase()}`} className="hover:text-cyan-300 transition-colors">
                  {item}
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center space-x-4">
          <Link href="/cart" className="text-cyan-300 hover:text-cyan-200 transition-colors">
            <ShoppingCart size={24} />
          </Link>
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-cyan-300 hover:text-cyan-200">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {isOpen && (
        <nav className="md:hidden mt-4">
          <ul className="flex flex-col space-y-2">
            {["Home", "Products", "About", "Contact"].map((item) => (
              <li key={item}>
                <Link
                  href={`/${item.toLowerCase()}`}
                  className="block py-2 px-4 hover:bg-blue-800 rounded transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}

export default function Hero() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-700 opacity-20 transform -rotate-45"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-blue-600 opacity-20 transform rotate-45"></div>
        <div className="absolute top-1/4 right-1/4 w-1/4 h-1/4 bg-blue-500 opacity-20 transform -rotate-12"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-5xl font-bold mb-6 text-white">Dive into Style</h1>
            <p className="text-xl mb-8 text-blue-200">
              Explore our ocean-inspired collection and make waves with your fashion.
            </p>
            <button className="bg-cyan-500 hover:bg-cyan-600 text-blue-900 font-bold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105">
              Shop Now
            </button>
          </div>
          <div className="w-full md:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-20 rounded-full transform rotate-45"></div>
            <Image
              src="/placeholder.svg?height=400&width=400"
              alt="Featured Product"
              width={400}
              height={400}
              className="rounded-full object-cover z-10 relative transform hover:rotate-3 transition-transform duration-300"
            />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-300 opacity-20 rounded-full"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-500 opacity-20 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Newsletter() {
    return (
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-blue-500 opacity-10 transform -rotate-45"></div>
          <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-blue-700 opacity-10 transform rotate-12"></div>
          <div className="absolute top-1/2 left-1/2 w-1/5 h-1/5 bg-blue-600 opacity-10 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-2xl p-12 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">Stay in the Loop</h2>
            <p className="text-blue-200 mb-8 text-center">
              Subscribe to our newsletter for exclusive offers and ocean-inspired content.
            </p>
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow bg-blue-700 text-blue-100 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 text-blue-900 font-bold py-3 px-8 rounded-full transition-colors duration-300 transform hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    )
  }
  
  export default function Home() {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-blue-100 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-800 opacity-20 transform -rotate-45"></div>
          <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-blue-700 opacity-20 transform rotate-45"></div>
          <div className="absolute top-1/4 right-1/4 w-1/3 h-1/3 bg-blue-600 opacity-20 transform -rotate-12"></div>
        </div>
        <div className="relative z-10">
          <Header />
          <main>
            <Hero />
            <FeaturedProducts />
            <Categories />
            <Newsletter />
          </main>
          <Footer />
        </div>
      </div>
    )
  }
  
    