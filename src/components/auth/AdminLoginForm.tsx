'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAdminLogin } from '@/hooks/useAuthMutations';
import { AdminLoginFormData, ClientLoginFormData } from '@/lib/validation';
import { ArrowLeft, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import loginBackground from '../../../public/background/login background.png';

export function AdminLoginForm() {
  const router = useRouter();
  const adminLoginMutation = useAdminLogin();

  const onSubmit = async (data: AdminLoginFormData | ClientLoginFormData) => {
    try {
      await adminLoginMutation.mutateAsync(data as AdminLoginFormData);
      toast.success('Login successful! Redirecting to your dashboard...');
      router.push('/admin/applications');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw error; 
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full h-full mx-auto flex">

        <div className="relative z-20 w-1/2 h-full rounded-2xl hidden md:block">
          <Image
            src={loginBackground}
            alt="WorldVisa DMS"
            fill
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute top-5 left-5 p-2 rounded-2xl bg-white/80 border border-white/20 ">
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

        <div className="flex w-full md:w-1/2 md:min-w-[480px] items-center justify-center relative">
          <Link href="/portal" className="absolute top-10 right-10 z-10">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              Back to Portal
            </Button>
          </Link>

          <div className="space-y-4 w-[90%] max-w-[400px] md:min-w-[450px]">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Login
            </h1>
            <p className="text-gray-600">
              Enter your credentials to access the admin portal
            </p>
            <LoginForm
              type="admin"
              onSubmit={onSubmit}
              isLoading={adminLoginMutation.isPending}
            />

          </div>
        </div>

      </div>
    </div>
  );
}
