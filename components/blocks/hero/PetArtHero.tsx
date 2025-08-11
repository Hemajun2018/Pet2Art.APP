"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
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

const styles = ["AI Powered", "High Quality", "Easy to Use"]

export default function PetArtHero() {
  const [currentGroup, setCurrentGroup] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const imageGroups = [
    allHeroImages.slice(0, 5),   // Images 1-5
    allHeroImages.slice(5, 10),  // Images 6-10
    allHeroImages.slice(10, 15)  // Images 11-15
  ]
  
  const currentImages = imageGroups[currentGroup]
  
  useEffect(() => {
    // Set mounted state to enable client-side animations
    setIsMounted(true)
    
    // Initial load animation only on client
    const loadTimer = setTimeout(() => setIsLoaded(true), 100)
    
    // Image rotation interval
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentGroup((prev) => (prev + 1) % 3)
        setIsTransitioning(false)
      }, 500)
    }, 5000)
    
    return () => {
      clearTimeout(loadTimer)
      clearInterval(interval)
    }
  }, [])
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1 flex flex-col justify-start pt-2">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2 leading-[1.1]">
              Create Amazing
            </h1>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 leading-[1.1]">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Artistic Photos
              </span>
            </h1>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-[1.1]">
              For Your Pets
            </h1>

            {/* Style Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {styles.map((style) => (
                <Badge 
                  key={style} 
                  variant="outline" 
                  className="px-3 py-1.5 text-sm border-border text-muted-foreground bg-secondary/50 hover:bg-secondary"
                >
                  {style}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <p className="text-base text-muted-foreground max-w-lg mb-6 leading-relaxed">
              Transform your pet's photos into stunning artistic portraits with AI. 
              Choose from various art styles and create unique masterpieces.
            </p>
            
            {/* AI Wrapper Disclosure */}
            <p className="text-sm text-muted-foreground/80 max-w-lg mb-4 leading-relaxed">
              Our platform offers a user-friendly interface built on top of advanced AI models 
              including GPT-4 Vision. We are an independent service not affiliated with OpenAI.
            </p>

            {/* CTA Button */}
            <div className="mb-6">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground px-7 py-3.5 text-base rounded-full shadow-lg transition-all duration-200 hover:shadow-xl font-semibold"
                onClick={() => {
                  document.getElementById('generate-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Try it free
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="text-primary">✨</span>
                <span>Free to try</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span>🎨</span>
                <span>Multiple art styles</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span>💎</span>
                <span>Stunning art effects</span>
              </span>
            </div>
          </div>

          {/* Right Photo Wall */}
          <div className="order-1 lg:order-2 relative -mt-8 lg:-mt-12">
            <div className={`relative w-full h-[480px] lg:h-[560px] transition-all duration-700 ${isMounted && isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
              {/* Photo Grid */}
              <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
                {/* Top Left - Large */}
                <div className={`row-span-2 relative transition-all duration-700 ${
                  isMounted && isLoaded ? 'translate-y-0 opacity-100' : isMounted ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
                }`} style={{ transitionDelay: '200ms' }}>
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-500">
                    <Image
                      src={currentImages[0].src}
                      alt={currentImages[0].alt}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-110"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Top Right */}
                <div className={`relative transition-all duration-700 ${
                  isMounted && isLoaded ? 'translate-y-0 opacity-100' : isMounted ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
                }`} style={{ transitionDelay: '400ms' }}>
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-500">
                    <Image
                      src={currentImages[1].src}
                      alt={currentImages[1].alt}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-110"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Bottom Right */}
                <div className={`relative transition-all duration-700 ${
                  isMounted && isLoaded ? 'translate-y-0 opacity-100' : isMounted ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
                }`} style={{ transitionDelay: '600ms' }}>
                  <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-500">
                    <Image
                      src={currentImages[2].src}
                      alt={currentImages[2].alt}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-110"
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              {/* Additional floating cards */}
              <div className={`absolute -bottom-6 -left-6 w-28 h-36 rounded-2xl overflow-hidden shadow-xl transform rotate-12 hover:rotate-6 hover:scale-110 transition-all duration-500 ${
                isMounted && isLoaded ? 'translate-x-0 opacity-100' : isMounted ? '-translate-x-10 opacity-0' : 'translate-x-0 opacity-100'
              }`} style={{ transitionDelay: '800ms' }}>
                <Image
                  src={currentImages[3].src}
                  alt={currentImages[3].alt}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-110"
                  unoptimized
                />
              </div>

              <div className={`absolute -top-6 -right-6 w-28 h-36 rounded-2xl overflow-hidden shadow-xl transform -rotate-12 hover:-rotate-6 hover:scale-110 transition-all duration-500 ${
                isMounted && isLoaded ? 'translate-x-0 opacity-100' : isMounted ? 'translate-x-10 opacity-0' : 'translate-x-0 opacity-100'
              }`} style={{ transitionDelay: '1000ms' }}>
                <Image
                  src={currentImages[4].src}
                  alt={currentImages[4].alt}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-110"
                  unoptimized
                />
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/4 -left-4 w-8 h-8 bg-primary rounded-full opacity-80 animate-pulse"></div>
              <div className="absolute bottom-1/3 -right-4 w-6 h-6 bg-primary/60 rounded-full opacity-60 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-accent rounded-full opacity-70 animate-pulse" style={{ animationDelay: "0.7s" }}></div>
              
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
                        ? 'w-8 bg-primary' 
                        : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
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