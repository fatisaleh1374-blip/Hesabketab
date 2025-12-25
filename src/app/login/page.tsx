'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { HesabKetabLogo } from '@/components/icons';
import { ALLOWED_USERS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client'; // <-- 1. Import Supabase client

const formSchema = z.object({
  email: z
    .string()
    .email({ message: 'لطفا یک ایمیل معتبر وارد کنید.' })
    .refine((email) => ALLOWED_USERS.includes(email.toLowerCase()), {
      message: 'شما اجازه ورود به این اپلیکیشن را ندارید.',
    }),
  password: z
    .string()
    .min(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true); // To check initial session
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 2. Check for active session and redirect if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/');
      } else {
        setIsUserLoading(false);
      }
    };
    checkSession();

    // Listen for auth changes to handle redirects after login/logout from other tabs
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);


  // 3. Rewritten onSubmit function for Supabase
  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    const { email, password } = values;

    // Supabase sign-in logic
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'خطا در ورود',
        description: 'ایمیل یا رمز عبور اشتباه است.', 
      });
    } else {
      toast({
        title: 'ورود موفق',
        description: 'شما با موفقیت وارد شدید. در حال انتقال...',
      });
      // No need for ensureUserProfile, the trigger handles it!
      // The onAuthStateChange listener will handle the redirect.
    }

    setIsLoading(false);
  }
  
  const totalLoading = isLoading || isUserLoading;

  // No changes needed for the JSX, it remains the same.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <HesabKetabLogo className="size-10 text-primary" />
            <h1 className="font-headline text-3xl font-bold">حساب کتاب</h1>
          </div>
          <CardTitle className="font-headline">ورود به حساب کاربری</CardTitle>
          <CardDescription>
             برای ادامه ایمیل و رمز عبور خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                        disabled={totalLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        disabled={totalLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={totalLoading}>
                {totalLoading && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
                ورود
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  );
}
