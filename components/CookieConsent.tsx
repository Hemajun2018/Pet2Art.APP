"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined")
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setShowBanner(false)
    // Disable non-essential cookies
    disableAnalytics()
  }

  const disableAnalytics = () => {
    // Disable Google Analytics or other tracking
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied"
      })
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t">
      <Card className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">🍪 Cookie Consent</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your experience on our website. Essential cookies help our site function properly, 
              while optional cookies help us understand how you use our service. You can choose to accept or decline 
              optional cookies. For more information, please read our{" "}
              <a href="/privacy-policy" className="underline hover:text-primary">
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="min-w-[100px]"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              className="min-w-[100px]"
            >
              Accept All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}