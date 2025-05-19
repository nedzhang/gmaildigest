import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, BarChart } from 'lucide-react';
import Link from 'next/link';
import LoginButton from '@/components/auth/LoginButton';

export default function LandingPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground bg-primary py-2 px-4 rounded-lg inline-block shadow-md">
          Gmail Digest
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Reclaim your time with AI-powered summaries of your Gmail threads. Focus on what matters, faster.
        </p>
        <LoginButton />
        <div className="mt-12">
          <Image
            src="https://placehold.co/1200x600.png"
            alt="Gmail Digest in action"
            width={1200}
            height={600}
            className="rounded-lg shadow-xl mx-auto"
            data-ai-hint="email interface productivity"
          />
        </div>
      </section>

      <section className="py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Why Gmail Digest?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center">
              <Zap className="w-12 h-12 text-accent mb-2" />
              <CardTitle>Instant Clarity</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                No more wading through long email chains. Get to the point with concise, AI-generated summaries.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center">
              <CheckCircle className="w-12 h-12 text-accent mb-2" />
              <CardTitle>Boost Productivity</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Spend less time reading emails and more time doing impactful work.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center">
              <BarChart className="w-12 h-12 text-accent mb-2" />
              <CardTitle>Stay Informed</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Quickly catch up on important discussions and decisions without getting lost in the details.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="text-center py-12">
        <h2 className="text-3xl font-bold mb-6">Ready to simplify your inbox?</h2>
        <LoginButton />
      </section>
    </div>
  );
}
