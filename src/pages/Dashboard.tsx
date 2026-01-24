import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

type TaxRequest = {
  id: string;
  fiscal_year: string;
  total_income: number;
  total_expense: number;
  taxable_income: number;
  calculated_tax: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  created_at: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TaxRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tax_requests")
          .select("*")
          .eq("citizen_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRequests(data ?? []);
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to fetch requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  const formatBDT = (n: number) => new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return { text: "📝 Draft", color: "text-gray-600" };
      case "submitted":
        return { text: "📤 Submitted", color: "text-blue-600" };
      case "approved":
        return { text: "✅ Approved", color: "text-green-600" };
      case "rejected":
        return { text: "❌ Rejected", color: "text-red-600" };
      default:
        return { text: status, color: "" };
    }
  };

  const downloadPDF = () => {
    if (!requests.length) return;
    const doc = new jsPDF();
    doc.text("Tax History", 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [["Date", "Fiscal Year", "Income", "Expense", "Taxable", "Tax", "Status"]],
      body: requests.map((r) => [
        new Date(r.created_at).toLocaleDateString(),
        r.fiscal_year,
        formatBDT(r.total_income),
        formatBDT(r.total_expense),
        formatBDT(r.taxable_income),
        formatBDT(r.calculated_tax),
        getStatusLabel(r.status).text,
      ]),
    });
    doc.save("tax_history.pdf");
  };

  return (
    <AppShell>
      <div className="container py-10">
        <h1 className="text-3xl font-semibold mb-6">Tax History</h1>

        <div className="mb-4">
          <Button onClick={downloadPDF} disabled={requests.length === 0}>
            Download PDF
          </Button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p>No tax requests found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fiscal Year</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expense</TableHead>
                <TableHead className="text-right">Taxable</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => {
                const statusLabel = getStatusLabel(r.status);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{r.fiscal_year}</TableCell>
                    <TableCell className="text-right">৳ {formatBDT(r.total_income)}</TableCell>
                    <TableCell className="text-right">৳ {formatBDT(r.total_expense)}</TableCell>
                    <TableCell className="text-right">৳ {formatBDT(r.taxable_income)}</TableCell>
                    <TableCell className="text-right">৳ {formatBDT(r.calculated_tax)}</TableCell>
                    <TableCell className={statusLabel.color}>{statusLabel.text}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </AppShell>
  );
}
