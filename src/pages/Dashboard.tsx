"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TaxRequest = {
  id: string;
  fiscal_year: string;
  total_income: number;
  total_expense: number;
  taxable_income: number;
  calculated_tax: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  created_at: string;
  officer_note?: string | null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TaxRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    if (!user) return;
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
      toast.error(e.message ?? "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  // Prepare data for graph
  const chartData = requests.map((r) => ({
    name: new Date(r.created_at).toLocaleDateString(),
    Income: r.total_income,
    Expense: r.total_expense,
    Taxable: r.taxable_income,
    Tax: r.calculated_tax,
  }));

  const statusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "submitted":
        return "orange";
      default:
        return "gray";
    }
  };

  // PDF Download
  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Tax History Report", 14, 20);

    // Table
    autoTable(doc, {
      startY: 30,
      head: [["Date", "Income", "Expense", "Taxable", "Tax", "Status", "Officer Note"]],
      body: requests.map((r) => [
        new Date(r.created_at).toLocaleDateString(),
        r.total_income,
        r.total_expense,
        r.taxable_income,
        r.calculated_tax,
        r.status,
        r.officer_note || "-",
      ]),
    });

    doc.save("tax_history.pdf");
  };

  return (
    <AppShell>
      <div className="container py-10 space-y-6">
        {/* Dashboard Top Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Tax History Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => (window.location.href = "https://next-tax.vercel.app/tax")}
            >
              Go to Tax Calculator
            </Button>
            <Button
              onClick={() => (window.location.href = "https://next-tax.vercel.app/trade")}
            >
              Go to Import/Export Calculator
            </Button>
            <Button onClick={fetchRequests} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button onClick={handlePdfDownload}>Download PDF</Button>
          </div>
        </div>

        {/* Graph */}
        <div className="mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Tax History Graph</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Income" stroke="#8884d8" />
                    <Line type="monotone" dataKey="Expense" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="Taxable" stroke="#ffc658" />
                    <Line type="monotone" dataKey="Tax" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p>No data to display</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tax History Table</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Expense</TableHead>
                  <TableHead>Taxable</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Officer Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>৳ {r.total_income}</TableCell>
                    <TableCell>৳ {r.total_expense}</TableCell>
                    <TableCell>৳ {r.taxable_income}</TableCell>
                    <TableCell>৳ {r.calculated_tax}</TableCell>
                    <TableCell style={{ color: statusColor(r.status), fontWeight: "bold" }}>
                      {r.status.toUpperCase()}
                    </TableCell>
                    <TableCell>{r.officer_note || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
