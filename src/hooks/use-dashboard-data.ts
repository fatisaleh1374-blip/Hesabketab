
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase'; // Keep for other collections
import { createClient } from '@/lib/supabase-client';
import type {
    Income,
    Expense,
    BankAccount,
    Category,
    Check,
    FinancialGoal,
    Loan,
    Payee,
    Transfer,
    LoanPayment,
    PreviousDebt,
    DebtPayment,
    UserProfile
} from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { useSupabaseAuth } from '@/components/providers/supabase-auth-provider';
import { PostgrestError } from '@supabase/supabase-js';

const FAMILY_DATA_DOC_PATH = 'family-data/shared-data';

// A custom hook to fetch Supabase data in real-time
function useSupabaseCollection<T>(table: string) {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PostgrestError | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: initialData, error: initialError } = await supabase.from(table).select('*');

            if (initialError) {
                console.error(`Error fetching ${table}:`, initialError);
                setError(initialError);
                setData([]);
            } else {
                setData(initialData as T[]);
            }
            setLoading(false);
        };

        fetchData();

        const channel = supabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                (payload) => {
                    console.log(`Realtime update for ${table}:`, payload);
                    fetchData(); // Re-fetch data to get the latest state
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, supabase]);

    return { data, loading, error };
}


export function useDashboardData() {
    const { user, isLoading: isUserLoading } = useSupabaseAuth(); // Use Supabase auth
    const firestore = useFirestore(); // Keep for legacy collections

    // === START: New Supabase data fetching ===
    const { data: supabaseUsers, loading: areUsersLoading } = useSupabaseCollection<UserProfile>('users');
    const { data: allTransactions, loading: areTransactionsLoading } = useSupabaseCollection<Income | Expense>('transactions');

    const incomes = useMemo(
        () => allTransactions?.filter((t) => t.type === 'income').map(t => ({...t, ownerId: t.owner_id, balanceAfter: t.balance_after, date: t.transaction_date, bankAccountId: t.account_id, registeredByUserId: t.user_id })) as Income[] | undefined,
        [allTransactions]
    );
    
    const expenses = useMemo(
        () => allTransactions?.filter((t) => t.type === 'expense') as Expense[] | undefined,
        [allTransactions]
    );

    const { data: bankAccounts, loading: areBankAccountsLoading } = useSupabaseCollection<BankAccount>('accounts');
    // === END: New Supabase data fetching ===


    // === START: Legacy Firestore data fetching (for other features) ===
    const baseDocRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, FAMILY_DATA_DOC_PATH);
    }, [firestore]);

    const categoriesQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'categories') : null), [baseDocRef]);
    const checksQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'checks') : null), [baseDocRef]);
    const loansQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'loans') : null), [baseDocRef]);
    const payeesQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'payees') : null), [baseDocRef]);
    const goalsQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'financialGoals') : null), [baseDocRef]);
    const transfersQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'transfers') : null), [baseDocRef]);
    const loanPaymentsQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'loanPayments') : null), [baseDocRef]);
    const previousDebtsQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'previousDebts') : null), [baseDocRef]);
    const debtPaymentsQuery = useMemo(() => (baseDocRef ? collection(baseDocRef, 'debtPayments') : null), [baseDocRef]);

    const { data: categories, isLoading: ilC } = useCollection<Category>(categoriesQuery);
    const { data: checks, isLoading: ilCH } = useCollection<Check>(checksQuery);
    const { data: loans, isLoading: ilL } = useCollection<Loan>(loansQuery);
    const { data: payees, isLoading: ilP } = useCollection<Payee>(payeesQuery);
    const { data: goals, isLoading: ilG } = useCollection<FinancialGoal>(goalsQuery);
    const { data: transfers, isLoading: ilT } = useCollection<Transfer>(transfersQuery);
    const { data: loanPayments, isLoading: ilLP } = useCollection<LoanPayment>(loanPaymentsQuery);
    const { data: previousDebts, isLoading: ilPD } = useCollection<PreviousDebt>(previousDebtsQuery);
    const { data: debtPayments, isLoading: ilDP } = useCollection<DebtPayment>(debtPaymentsQuery);
    // === END: Legacy Firestore data fetching ===


    const isLoading = isUserLoading || areUsersLoading || areTransactionsLoading || areBankAccountsLoading || ilC || ilCH || ilL || ilP || ilG || ilT || ilLP || ilPD || ilDP;

    const allData = useMemo(() => ({
        firestore,
        // --- Supabase Data ---
        incomes: incomes || [],
        expenses: expenses || [],
        bankAccounts: bankAccounts || [],
        users: supabaseUsers || [],
        // --- Firestore Data (for now) ---
        categories: categories || [],
        checks: checks || [],
        loans: loans || [],
        payees: payees || [],
        goals: goals || [],
        transfers: transfers || [],
        loanPayments: loanPayments || [],
        previousDebts: previousDebts || [],
        debtPayments: debtPayments || [],
    }), [
        firestore, incomes, expenses, bankAccounts, supabaseUsers,
        categories, checks, loans, payees, goals, transfers, loanPayments, previousDebts, debtPayments
    ]);

    return { isLoading, allData };
}

