'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminLogin } from '@/hooks/useAuthMutations';
import { AdminLoginFormData, adminLoginSchema } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { gsap } from 'gsap';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import loginBackground from '../../../public/background/login background.png';

export function AdminLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const adminLoginMutation = useAdminLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  useEffect(() => {
    if (leftRef.current && rightRef.current) {
      gsap.set([leftRef.current, rightRef.current], {
        opacity: 0,
        y: 50,
      });

      gsap.to([leftRef.current, rightRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
      });
    }
  }, []);

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      await adminLoginMutation.mutateAsync(data);
      router.push('/admin/applications');
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Login failed. Please try again.',
      });
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-sky-100 flex items-center justify-center">
      <div ref={formRef} className="w-full h-full mx-auto flex">

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

        {/* Right Side - Login Form */}
        <div
          ref={rightRef}
          className="flex w-full md:w-1/2 md:min-w-[480px] items-center justify-center"
        >
          <div className="space-y-6 w-[90%] max-w-[400px] md:min-w-[450px]">
            <Card className="shadow-xl border-0">
              <CardHeader className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Admin Login
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Enter your credentials to access the admin portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {errors.root && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.root.message}</AlertDescription>
                    </Alert>
                  )}

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="h-12"
                      {...register('username')}
                    />
                    {errors.username && (
                      <p className="text-sm text-red-600">{errors.username.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="h-12 pr-12"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium"
                    disabled={adminLoginMutation.isPending}
                  >
                    {adminLoginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
