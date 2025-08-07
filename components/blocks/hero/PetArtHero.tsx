"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

const allHeroImages = [
  { src: "/hero/1.png", alt: "Pet Portrait 1", isOriginal: false },
  { src: "/hero/2.jpg", alt: "Pet Portrait 2", isOriginal: true },
  { src: "/hero/3.jpg", alt: "Pet Portrait 3", isOriginal: false },
  { src: "/hero/4.jpg", alt: "Pet Portrait 4", isOriginal: false },
  { src: "/hero/5.png", alt: "Pet Portrait 5", isOriginal: false },
  { src: "/hero/6.jpg", alt: "Pet Portrait 6", isOriginal: false },
  { src: "/hero/7.jpg", alt: "Pet Portrait 7", isOriginal: false },
  { src: "/hero/8.jpg", alt: "Pet Portrait 8", isOriginal: false },
  { src: "/hero/9.jpg", alt: "Pet Portrait 9", isOriginal: false },
  { src: "/hero/10.jpg", alt: "Pet Portrait 10", isOriginal: true },
  { src: "/hero/11.jpg", alt: "Pet Portrait 11", isOriginal: false },
  { src: "/hero/12.jpg", alt: "Pet Portrait 12", isOriginal: false },
  { src: "/hero/13.jpg", alt: "Pet Portrait 13", isOriginal: false },
  { src: "/hero/14.jpg", alt: "Pet Portrait 14", isOriginal: false },
  { src: "/hero/15.avif", alt: "Pet Portrait 15", isOriginal: false }
]

const styles = ["Vintage", "Renaissance", "Painting"]

export default function PetArtHero() {
  const [currentGroup, setCurrentGroup] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const imageGroups = [
    allHeroImages.slice(0, 5),   // Images 1-5
    allHeroImages.slice(5, 10),  // Images 6-10
    allHeroImages.slice(10, 15)  // Images 11-15
  ]
  
  const currentImages = imageGroups[currentGroup]
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentGroup((prev) => (prev + 1) % 3)
        setIsTransitioning(false)
      }, 300)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Create Beautiful
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                Artistic Photos
              </span>
              <br />
              <span className="text-4xl md:text-5xl lg:text-6xl">For Your Pets</span>
            </h1>

            {/* Style Tags */}
            <div className="flex flex-wrap gap-3 mb-8">
              {styles.map((style) => (
                <Badge 
                  key={style} 
                  variant="outline" 
                  className="px-4 py-2 text-lg border-border text-muted-foreground bg-secondary/50 hover:bg-secondary"
                >
                  {style}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <p className="text-lg text-gray-600 max-w-md mb-8">
              Transform your pet's photos into stunning artistic portraits with AI. 
              Choose from various art styles and create unique masterpieces in seconds.
            </p>

            {/* CTA Button */}
            <Link href="/generate">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full shadow-lg transition-all duration-200 hover:shadow-xl font-semibold"
              >
                Try it free
              </Button>
            </Link>

            {/* Social Proof */}
            <div className="flex items-center gap-6 text-sm text-gray-500 mt-8">
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★★★★★</span>
                4.9/5
              </span>
              <span>•</span>
              <span>10,000+ happy pet owners</span>
            </div>
          </div>

          {/* Right Photo Wall */}
          <div className="order-1 lg:order-2 relative">
            <div className={`relative w-full h-[600px] lg:h-[700px] transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {/* Photo Grid */}
              <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
                {/* Top Left - Large */}
                <div className="row-span-2 relative">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <Image
                      src={currentImages[0].src}
                      alt={currentImages[0].alt}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Top Right */}
                <div className="relative">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                    <Image
                      src={currentImages[1].src}
                      alt={currentImages[1].alt}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {currentImages[1].isOriginal && (
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-yellow-400 text-black px-3 py-1 text-sm font-medium shadow-lg">
                          Original
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Right */}
                <div className="relative">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                    <Image
                      src={currentImages[2].src}
                      alt={currentImages[2].alt}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              {/* Additional floating cards */}
              <div className="absolute -bottom-8 -left-8 w-32 h-40 rounded-2xl overflow-hidden shadow-xl transform rotate-12 hover:rotate-6 transition-transform duration-300">
                <Image
                  src={currentImages[3].src}
                  alt={currentImages[3].alt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="absolute -top-8 -right-8 w-32 h-40 rounded-2xl overflow-hidden shadow-xl transform -rotate-12 hover:-rotate-6 transition-transform duration-300">
                <Image
                  src={currentImages[4].src}
                  alt={currentImages[4].alt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/4 -left-4 w-8 h-8 bg-yellow-400 rounded-full opacity-80 animate-pulse"></div>
              <div className="absolute bottom-1/3 -right-4 w-6 h-6 bg-blue-500 rounded-full opacity-60 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-green-400 rounded-full opacity-70 animate-pulse" style={{ animationDelay: "0.7s" }}></div>
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsTransitioning(true)
                      setTimeout(() => {
                        setCurrentGroup(index)
                        setIsTransitioning(false)
                      }, 300)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentGroup === index 
                        ? 'w-8 bg-purple-600' 
                        : 'bg-gray-400 hover:bg-gray-600'
                    }`}
                    aria-label={`Go to image group ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}