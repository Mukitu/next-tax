"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

type TradeRow = {
  id: string;
  created_at: string;
  type: string;
  country: string;
  product_category: string;
  product_name: string;
  amount: number;
  calculated_tax: number;
};

function formatBDT(n: number) {
  return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);
}

async function fetchMyTrade(userId: string): Promise<TradeRow[]> {
  const { data, error } = await supabase
    .from("import_export_records")
    .select("id, created_at, type, country, product_category, product_name, amount, calculated_tax")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as TradeRow[];
}

export default function TradeHistoryClient() {
  const { user } = useAuth();
  const [pdfMake, setPdfMake] = useState<any>(null);

  const q = useQuery({
    queryKey: ["trade_history", user?.id ?? null],
    queryFn: () => fetchMyTrade(user!.id),
    enabled: Boolean(user?.id),
  });

  const rows = q.data ?? [];

  // dynamic import of pdfMake for client only
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("pdfmake/build/pdfmake").then((pdf) => {
        import("pdfmake/build/vfs_fonts").then((fonts) => {
          pdf.vfs = fonts.pdfMake.vfs;
          setPdfMake(pdf);
        });
      });
    }
  }, []);

  const downloadPDF = () => {
    if (!rows.length || !pdfMake) return;

    const totalAmount = rows.reduce((acc, r) => acc + r.amount, 0);
    const totalTax = rows.reduce((acc, r) => acc + r.calculated_tax, 0);

    const body = [
      ["Date","Type","Country","Category","Product","Amount (৳)","Tax (৳)"],
      ...rows.map((r) => [
        new Date(r.created_at).toLocaleDateString("en-GB"),
        r.type,
        r.country,
        r.product_category,
        r.product_name,
        { text: formatBDT(r.amount), color: "green" },
        { text: formatBDT(r.calculated_tax), color: "blue" }
      ])
    ];

    const docDef: any = {
      pageSize: "A4",
      pageMargins: [40,60,40,60],
      content: [
        { text: "NEXT TAX Import / Export", style:"header"},
        { text: `Generated: ${new Date().toLocaleString()}\n\n`, style:"subheader"},
        {
          table: { headerRows:1, widths:["auto","auto","auto","auto","*","auto","auto"], body }
        },
        {
          text: `\nTotal Amount: ৳ ${formatBDT(totalAmount)}  |  Total Tax: ৳ ${formatBDT(totalTax)}  |  Final: ৳ ${formatBDT(totalAmount+totalTax)}`,
          style: "summary",
          bold:true
        }
      ],
      styles:{
        header:{fontSize:18,bold:true,alignment:"center",margin:[0,0,0,10]},
        subheader:{fontSize:10,italics:true,alignment:"center",margin:[0,0,0,10]},
        summary:{fontSize:12,alignment:"right",margin:[0,10,0,0]}
      }
    };

    pdfMake.createPdf(docDef).download("NEXT_TAX_Import_Export.pdf");
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-2xl font-semibold">Import / Export History</h2>
        <div className="flex gap-2">
          <Button onClick={downloadPDF} disabled={!pdfMake || !rows.length}>Download PDF</Button>
          <Button asChild><a href="/trade">New record</a></Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <div>{q.isLoading ? "Loading..." : `${rows.length} records`}</div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.created_at).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell className="capitalize">{r.type}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell>{r.product_category}</TableCell>
                    <TableCell>{r.product_name}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">৳ {formatBDT(r.amount)}</TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">৳ {formatBDT(r.calculated_tax)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
