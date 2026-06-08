import { PanelLayout } from "@/components/PanelLayout";
import { PageHeader } from "@/components/DashboardWidgets";
import { Plus, ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const addAmounts = [200, 500, 1000, 2000];

export default function Wallet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [custom, setCustom] = useState("");
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWallet = async () => {
    if (!user) return;
    const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle();
    if (wallet) {
      setBalance(Number(wallet.balance));
    } else {
      // Create wallet if doesn't exist
      await supabase.from("wallets").insert({ user_id: user.id, balance: 0 });
      setBalance(0);
    }
    const { data: txns } = await supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setTransactions(txns || []);
  };

  useEffect(() => { fetchWallet(); }, [user]);

  const handleAddMoney = async () => {
    const amount = parseFloat(custom);
    if (!user || !amount || amount <= 0) return;
    setLoading(true);
    const newBalance = balance + amount;
    await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", user.id);
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      amount,
      type: "credit",
      description: "Wallet Recharge",
      balance_after: newBalance,
    });
    setLoading(false);
    toast({ title: `₹${amount} added to wallet! 💰` });
    setCustom("");
    setShowAdd(false);
    fetchWallet();
  };

  return (
    <PanelLayout panel="customer">
      <PageHeader title="Wallet" subtitle="Manage your Drive My Car balance">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Money
        </button>
      </PageHeader>

      <div className="p-4 sm:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-hero rounded-2xl p-5 sm:p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <WalletIcon className="w-6 h-6 opacity-80" />
            <span className="text-sm opacity-80">Available Balance</span>
          </div>
          <p className="text-4xl font-display font-bold">₹{balance.toLocaleString()}</p>
          <p className="text-xs mt-2 opacity-60">Last updated: Just now</p>
        </motion.div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-elevated">
            <h3 className="font-display font-semibold text-lg mb-4">Add Money</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {addAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCustom(String(amt))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all touch-target ${custom === String(amt) ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted hover:border-primary/40"}`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Or enter custom amount"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-full px-4 py-3 bg-muted rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleAddMoney} 
                disabled={loading} 
                className="flex-1 py-3 bg-gradient-hero text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 touch-target"
              >
                {loading ? "Processing..." : "Proceed to Pay"}
              </button>
              <button 
                onClick={() => setShowAdd(false)} 
                className="px-5 py-3 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors touch-target"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div>
          <h3 className="font-display font-semibold text-lg mb-3">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          ) : (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border">
              {transactions.map((tx, i) => (
                <motion.div 
                  key={tx.id} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: i * 0.05 }} 
                  className="flex items-center gap-3 sm:gap-4 p-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "credit" ? "bg-green-500/10" : "bg-destructive/10"}`}>
                    {tx.type === "credit" ? <ArrowDownLeft className="w-5 h-5 text-green-600" /> : <ArrowUpRight className="w-5 h-5 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${tx.type === "credit" ? "text-green-600" : "text-destructive"}`}>
                    {tx.type === "credit" ? "+" : "-"}₹{Number(tx.amount).toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}
