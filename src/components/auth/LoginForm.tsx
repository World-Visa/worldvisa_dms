'use client';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  AdminLoginFormData,
  ClientLoginFormData,
  adminLoginSchema,
  clientLoginSchema,
} from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  type: 'admin' | 'client';
  onSubmit: (data: AdminLoginFormData | ClientLoginFormData) => Promise<void>;
  isLoading: boolean;
  className?: string;
}

type LoginFormData = AdminLoginFormData | ClientLoginFormData;

export function LoginForm({
  type,
  onSubmit,
  isLoading,
  className,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = type === 'admin';
  const schema = isAdmin ? adminLoginSchema : clientLoginSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = async (data: LoginFormData) => {
    await onSubmit(data as AdminLoginFormData | ClientLoginFormData);
  };

  const fieldName = isAdmin ? 'username' : 'email';
  const fieldLabel = isAdmin ? 'Username' : 'Email';
  const fieldPlaceholder = isAdmin
    ? 'Enter your username'
    : 'name@example.com';
  const fieldType = isAdmin ? 'text' : 'email';

  // Type-safe register for the dynamic field
  const registerField = () => {
    if (isAdmin) {
      return register('username' as keyof LoginFormData);
    }
    return register('email' as keyof LoginFormData);
  };

  return (
    <div className={cn('grid gap-6', className)}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel className="sr-only" htmlFor={fieldName}>
              {fieldLabel}
            </FieldLabel>
            <Input
              id={fieldName}
              type={fieldType}
              placeholder={fieldPlaceholder}
              autoCapitalize="none"
              autoComplete={isAdmin ? 'username' : 'email'}
              autoCorrect="off"
              disabled={isLoading}
              className='h-11 border-gray-300 rounded-md'
              aria-invalid={!!(errors as any)[fieldName]}
              {...registerField()}
            />
            <FieldError
              errors={(errors as any)[fieldName] ? [(errors as any)[fieldName]] : []}
            />
          </Field>

          <Field>
            <FieldLabel className="sr-only" htmlFor="password">
              Password
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoCapitalize="none"
                autoComplete="current-password"
                autoCorrect="off"
                disabled={isLoading}
                className="pr-10 h-11 border-gray-300 rounded-md"
                aria-invalid={!!errors.password}
                {...register('password' as keyof LoginFormData)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm disabled:pointer-events-none disabled:opacity-50"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError errors={errors.password ? [errors.password] : []} />
          </Field>

          <Field>
            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-blue-600 text-white rounded-md cursor-pointer">
              {isLoading && <Spinner className="mr-2" />}
              Sign In
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
