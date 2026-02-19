"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAdminLogin, useClientLogin } from "@/hooks/useAuthMutations";

const adminSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

const clientSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

type AdminFormValues = z.infer<typeof adminSchema>;
type ClientFormValues = z.infer<typeof clientSchema>;

export function LoginFormV2({ type }: { type: "admin" | "client" }) {
  const router = useRouter();
  const adminLogin = useAdminLogin();
  const clientLogin = useClientLogin();

  const isPending = type === "admin" ? adminLogin.isPending : clientLogin.isPending;

  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { username: "", password: "", remember: false },
  });

  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onAdminSubmit = async (data: AdminFormValues) => {
    try {
      await adminLogin.mutateAsync({
        username: data.username,
        password: data.password,
        rememberMe: data.remember ?? false,
      });
      toast.success("Welcome back! 👋");
      router.push("/admin/applications");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed. Please try again.");
    }
  };

  const onClientSubmit = async (data: ClientFormValues) => {
    try {
      await clientLogin.mutateAsync({
        email: data.email,
        password: data.password,
        rememberMe: data.remember ?? false,
      });
      toast.success("Welcome back! 👋");
      router.push("/client/applications");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed. Please try again.");
    }
  };

  if (type === "admin") {
    return (
      <Form {...adminForm}>
        <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
          <FormField
            control={adminForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input id="username" type="text" placeholder="Enter your username" autoComplete="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={adminForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={adminForm.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center">
                <FormControl>
                  <Checkbox id="login-remember" checked={field.value} onCheckedChange={field.onChange} className="size-4" />
                </FormControl>
                <FormLabel htmlFor="login-remember" className="ml-1 font-medium text-muted-foreground text-sm">
                  Remember me for 30 days
                </FormLabel>
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 size-4 animate-spin" /> Logging in...</> : "Login"}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...clientForm}>
      <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
        <FormField
          control={clientForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={clientForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={clientForm.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox id="login-remember" checked={field.value} onCheckedChange={field.onChange} className="size-4" />
              </FormControl>
              <FormLabel htmlFor="login-remember" className="ml-1 font-medium text-muted-foreground text-sm">
                Remember me for 30 days
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? <><Loader2 className="mr-2 size-4 animate-spin" /> Logging in...</> : "Login"}
        </Button>
      </form>
    </Form>
  );
}