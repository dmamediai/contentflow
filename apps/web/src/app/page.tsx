import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-4 mb-16 border-b">
          <div className="text-2xl font-bold">ContentFlow</div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            AI-Powered Social Media Management
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Create, repurpose, schedule, and publish content across multiple platforms using AI.
            Save hours on content creation and boost your social media presence.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="grid md:grid-cols-3 gap-8 my-20">
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">AI Content Studio</h3>
            <p className="text-muted-foreground">
              Generate, rewrite, expand, and optimize content for any platform with advanced AI.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Multi-Platform Scheduling</h3>
            <p className="text-muted-foreground">
              Schedule posts across Facebook, Instagram, LinkedIn, X, and more from one dashboard.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Content Repurposing</h3>
            <p className="text-muted-foreground">
              Transform blogs, podcasts, and videos into engaging social media content automatically.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground">
              Track engagement, reach, growth, and optimize your content strategy with real-time data.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Carousel Creator</h3>
            <p className="text-muted-foreground">
              Design beautiful carousels with AI-generated slides and export to PNG or PDF.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold mb-2">Media Library</h3>
            <p className="text-muted-foreground">
              Organize images, videos, and AI-generated assets in a centralized library.
            </p>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="my-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-card rounded-lg border">
              <h3 className="text-2xl font-semibold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6">Perfect to get started</p>
              <p className="text-3xl font-bold mb-6">$0</p>
              <ul className="space-y-2 text-sm mb-6">
                <li>✓ Up to 10 posts/month</li>
                <li>✓ 1 team member</li>
                <li>✓ Basic AI features</li>
                <li>✓ 5 connected accounts</li>
              </ul>
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </div>
            <div className="p-8 bg-card rounded-lg border border-primary shadow-lg">
              <div className="text-sm font-semibold text-primary mb-2">POPULAR</div>
              <h3 className="text-2xl font-semibold mb-2">Pro</h3>
              <p className="text-muted-foreground mb-6">For growing businesses</p>
              <p className="text-3xl font-bold mb-6">$29<span className="text-lg">/mo</span></p>
              <ul className="space-y-2 text-sm mb-6">
                <li>✓ Unlimited posts</li>
                <li>✓ Up to 5 team members</li>
                <li>✓ Advanced AI features</li>
                <li>✓ 20 connected accounts</li>
                <li>✓ Analytics dashboard</li>
              </ul>
              <Button className="w-full">Start Free Trial</Button>
            </div>
            <div className="p-8 bg-card rounded-lg border">
              <h3 className="text-2xl font-semibold mb-2">Agency</h3>
              <p className="text-muted-foreground mb-6">For agencies and teams</p>
              <p className="text-3xl font-bold mb-6">$99<span className="text-lg">/mo</span></p>
              <ul className="space-y-2 text-sm mb-6">
                <li>✓ Unlimited everything</li>
                <li>✓ Unlimited team members</li>
                <li>✓ Premium AI models</li>
                <li>✓ Unlimited accounts</li>
                <li>✓ Advanced analytics</li>
                <li>✓ API access</li>
              </ul>
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="my-20 py-16 bg-primary text-primary-foreground rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your social media?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of creators and businesses using ContentFlow to automate their content strategy.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="px-8">
              Start Free Trial Today
            </Button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t py-8 mt-16 text-center text-muted-foreground">
          <p>&copy; 2024 ContentFlow. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
