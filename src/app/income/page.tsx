
'use client';

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Plus } from 'lucide-react';
import { IncomeList } from '@/components/income/income-list';
import { IncomeForm } from '@/components/income/income-form';
import type { Income, BankAccount, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { useSupabaseAuth } from '@/components/providers/supabase-auth-provider';

export default function IncomePage() {
  const { user, isLoading: isUserLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const { isLoading: isDashboardLoading, allData } = useDashboardData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const supabase = createClient();

  // Data is now coming from Supabase via the updated hook
  const { incomes, bankAccounts, users } = allData;

  const handleFormSubmit = useCallback(async (values: Omit<Income, 'id' | 'createdAt' | 'updatedAt' | 'registeredByUserId' | 'type' | 'category' | 'date'> & { date: Date }) => {
    if (!user) {
        toast({ variant: "destructive", title: "خطا", description: "برای ثبت درآمد باید ابتدا وارد شوید." });
        return;
    }

    try {
        const { data, error } = await supabase.rpc('add_income_transaction', {
            p_user_id: user.id,
            p_account_id: values.bankAccountId,
            p_amount: values.amount,
            p_description: values.description,
            p_transaction_date: values.date.toISOString(),
            p_source: values.source,
            p_owner_id: values.ownerId,
            p_category: 'درآمد'
        });

        if (error) {
            throw error;
        }

        setIsFormOpen(false);
        toast({ title: "موفقیت", description: "درآمد جدید با موفقیت ثبت شد." });

        // TODO: Re-implement notification logic if needed, using Supabase

    } catch (error: any) {
        console.error('Error submitting income:', error);
        toast({
            variant: "destructive",
            title: "خطا در ثبت درآمد",
            description: error.message || "مشکلی در ثبت اطلاعات پیش آمد. لطفا دوباره تلاش کنید.",
        });
    }
  }, [user, supabase, toast]);

  const handleDelete = useCallback(async (incomeId: string) => {
    if (!user) {
        toast({ variant: "destructive", title: "خطا", description: "برای حذف درآمد باید ابتدا وارد شوید." });
        return;
    }

    try {
        const { error } = await supabase.rpc('delete_income_transaction', {
            p_transaction_id: incomeId,
            p_user_id: user.id
        });

        if (error) {
            throw error;
        }

        toast({ title: "موفقیت", description: "تراکنش درآمد با موفقیت حذف و مبلغ آن از حساب کسر شد." });

    } catch (error: any) {
        console.error('Error deleting income:', error);
        toast({
            variant: "destructive",
            title: "خطا در حذف درآمد",
            description: error.message || "مشکلی در حذف تراکنش پیش آمد.",
        });
    }
  }, [user, supabase, toast]);

  const handleAddNew = useCallback(() => {
    setIsFormOpen(true);
  }, []);
  
  const isLoading = isUserLoading || isDashboardLoading;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" className="md:hidden">
                <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            مدیریت درآمدها
          </h1>
        </div>
        <div className="hidden md:block">
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                ثبت درآمد جدید
            </Button>
        </div>
      </div>

       <IncomeForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={null}
          bankAccounts={bankAccounts || []}
          user={user} // Pass supabase user
        />

      {isLoading ? (
          <div className="space-y-4 mt-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
          </div>
      ) : (
        <IncomeList
          incomes={incomes || []}
          bankAccounts={bankAccounts || []}
          users={users || []}
          onDelete={handleDelete}
        />
      )}

      <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Button
            onClick={handleAddNew}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            aria-label="ثبت درآمد جدید"
          >
            <Plus className="h-6 w-6" />
          </Button>
      </div>
    </div>
  );
}

