"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { gsap } from "gsap";
import { ArrowRight, Shield, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import loginBackground from "../../../../public/background/login background.png";

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
    <div className="h-screen bg-linear-to-br from-violet-50 via-purple-50 to-sky-100 flex items-center justify-center">
      <div className="w-full h-full mx-auto flex">
        {/* Left Side - Image with Overlay */}
        <div
          ref={leftRef}
          className="relative z-20 w-1/2 h-full rounded-2xl hidden md:block"
        >
          <Image
            src={loginBackground}
            alt="WorldVisa DMS"
            fill
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute top-5 left-5 p-2 rounded-2xl bg-white/70 border border-white/20 backdrop-blur-md shadow-lg">
            <div className="relative h-12 w-48">
              <Image
                src="/logos/world-visa-logo.webp"
                alt="WorldVisa Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
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
        <div className="flex w-full md:w-1/2  md:min-w-[480px] items-center justify-center">
          <div className="space-y-6 w-[90%] md:min-w-[450px]">
            <div className="relative m-auto my-3 h-12 w-48">
              <Image
                src="/logos/world-visa-logo.webp"
                alt="WorldVisa Logo"
                fill
                className="object-contain"
              />
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
