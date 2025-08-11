"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { downloadImage } from "@/lib/petAiApi"
import { formatDistanceToNow } from 'date-fns'

interface Artwork {
  artwork_id: string
  user_uuid: string
  created_at: string
  template_name?: string
  template_category?: string
  generated_image_url: string
  original_image_url?: string
  aspect_ratio?: string
  status: string
  credits_used: number
  is_public: boolean
  likes?: number
  views?: number
}

export default function MyArtworksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [favorites, setFavorites] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("my-artworks")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchArtworks()
  }, [session, activeTab, page])

  const fetchArtworks = async () => {
    try {
      setIsLoading(true)
      const type = activeTab === "my-artworks" ? "user" : "favorites"
      const response = await fetch(`/api/get-artworks?type=${type}&page=${page}&limit=12`)
      const data = await response.json()
      
      if (data.success) {
        if (page === 1) {
          if (type === "user") {
            setArtworks(data.data)
          } else {
            setFavorites(data.data)
          }
        } else {
          if (type === "user") {
            setArtworks(prev => [...prev, ...data.data])
          } else {
            setFavorites(prev => [...prev, ...data.data])
          }
        }
        setHasMore(data.pagination.hasMore)
      }
    } catch (error) {
      console.error("Failed to fetch artworks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (imageUrl: string, artworkId: string) => {
    try {
      await downloadImage(imageUrl, `pet-art-${artworkId}.png`)
    } catch (error) {
      alert("Download failed. Please try again")
    }
  }

  const toggleVisibility = async (artworkId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/update-artwork-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artwork_id: artworkId,
          is_public: !currentStatus
        })
      })

      if (response.ok) {
        setArtworks(prev => prev.map(art => 
          art.artwork_id === artworkId 
            ? { ...art, is_public: !currentStatus }
            : art
        ))
      }
    } catch (error) {
      console.error("Failed to update visibility:", error)
    }
  }

  const toggleFavorite = async (artworkId: string) => {
    try {
      const response = await fetch("/api/toggle-favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artwork_id: artworkId })
      })

      if (response.ok) {
        const result = await response.json()
        if (!result.favorited && activeTab === "favorites") {
          setFavorites(prev => prev.filter(art => art.artwork_id !== artworkId))
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  const renderArtworkCard = (artwork: Artwork, isFavorites = false) => (
    <Card key={artwork.artwork_id} className="overflow-hidden">
      <div className="relative aspect-[3/4]">
        <Image
          src={artwork.generated_image_url}
          alt={artwork.template_name || "Pet Art"}
          fill
          className="object-cover"
          unoptimized
        />
        {artwork.is_public && (
          <Badge className="absolute top-2 left-2" variant="secondary">
            Public
          </Badge>
        )}
        {artwork.status === "completed" && (
          <Badge className="absolute top-2 right-2" variant="default">
            ✓ Completed
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-1">
          {artwork.template_name || "Custom Art"}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          {artwork.template_category || "Custom"}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>👁 {artwork.views || 0}</span>
          <span>❤️ {artwork.likes || 0}</span>
          <span>{formatDistanceToNow(new Date(artwork.created_at), { addSuffix: true })}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDownload(artwork.generated_image_url, artwork.artwork_id)}
        >
          Download
        </Button>
        {!isFavorites && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleVisibility(artwork.artwork_id, artwork.is_public)}
          >
            {artwork.is_public ? "Make Private" : "Make Public"}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleFavorite(artwork.artwork_id)}
        >
          {isFavorites ? "Unfavorite" : "Favorite"}
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Artworks</h1>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        setPage(1)
      }}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-artworks">My Creations</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="my-artworks">
          {isLoading && page === 1 ? (
            <div className="text-center py-12">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p>Loading your artworks...</p>
            </div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">You haven't created any artworks yet</p>
              <Button onClick={() => router.push("/#generate-section")}>
                Create Your First Artwork
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {artworks.map(artwork => renderArtworkCard(artwork))}
              </div>
              {hasMore && (
                <div className="text-center mt-8">
                  <Button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          {isLoading && page === 1 ? (
            <div className="text-center py-12">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p>Loading your favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">You haven't favorited any artworks yet</p>
              <Button onClick={() => router.push("/showcase")}>
                Explore Gallery
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.map(artwork => renderArtworkCard(artwork, true))}
              </div>
              {hasMore && (
                <div className="text-center mt-8">
                  <Button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}