'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, ArrowRight } from 'lucide-react';

export default function PortalPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && leftRef.current && rightRef.current) {
      // Set initial states
      gsap.set([leftRef.current, rightRef.current], {
        opacity: 0,
        y: 50,
      });

      // Animate in
      gsap.to([leftRef.current, rightRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div 
        ref={containerRef}
        className="w-full max-w-6xl mx-auto"
      >
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Image with Overlay */}
          <div 
            ref={leftRef}
            className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              src="https://images.pexels.com/photos/17620435/pexels-photo-17620435.jpeg"
              alt="WorldVisa DMS"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                WorldVisa Document Management System
              </h1>
              <p className="text-lg lg:text-xl text-blue-100 font-medium">
                for PR Visas
              </p>
            </div>
          </div>

          {/* Right Side - Portal Selection */}
          <div 
            ref={rightRef}
            className="space-y-6"
          >
            <div className="text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Welcome to WorldVisa DMS
              </h2>
              <p className="text-gray-600 text-lg">
                Choose your portal to access the system
              </p>
            </div>

            <div className="grid gap-4">
              {/* Admin Portal */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        Admin Portal
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Access administrative functions and manage the system
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href="/admin-login">
                    <Button 
                      className="w-full group-hover:bg-blue-600 transition-colors"
                      size="lg"
                    >
                      Login as Admin
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Client Portal */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        Client Portal
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Access your documents and track your application status
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href="/client-login">
                    <Button 
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50 group-hover:border-green-300 transition-colors"
                      size="lg"
                    >
                      Login as Client
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Logo */}
            <div className="flex justify-center lg:justify-start pt-4">
              <div className="relative h-12 w-48">
                <Image
                  src="/logos/world-visa-logo.webp"
                  alt="WorldVisa Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}