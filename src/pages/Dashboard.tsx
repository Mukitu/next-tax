"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <AppShell>
      {/* Mobile-only Sticky Top Bar */}
      <div className="flex md:hidden flex-col sticky top-0 z-50 bg-white shadow-lg border-b">
        <div className="flex items-center justify-between py-3 px-4">
          <div className="text-xl font-bold text-blue-600">NEXT TAX</div>
          <Button size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? "Close" : "Menu"}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="flex flex-col gap-2 py-2 px-4 border-t bg-white shadow-md">
            <a href="/" className="hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="/guide" className="hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Guide</a>
            <a href="/team" className="hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Team</a>
            <a href="/dashboard" className="hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="/tax" className="hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Tax Calculator</a>
            <a href="/trade" className="hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Import/Export</a>
          </div>
        )}
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-semibold mb-6">Tax History Dashboard</h1>

        <div className="mb-6 flex gap-2 flex-wrap">
          <Button onClick={fetchRequests} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {/* Graph */}
        <div className="mb-10">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Tax History Graph</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
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
                <p className="text-gray-500">No data to display</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-md">
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
