export default function SupportBar() {
  return (
    <section className="py-8 bg-muted/50 border-t">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Customer Support:</span>
              <a 
                href="mailto:petart_studio@outlook.com" 
                className="text-sm text-primary hover:underline font-semibold"
              >
                petart_studio@outlook.com
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              Response within 3 business days
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/my-orders" 
              className="text-sm text-primary hover:underline"
            >
              Manage Subscription
            </a>
            <span className="text-muted-foreground">|</span>
            <a 
              href="/refund-policy" 
              className="text-sm text-primary hover:underline"
            >
              30-Day Money Back Guarantee
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}