import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/browserClient";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

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

export default function TradeHistoryPage() {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["trade_history", user?.id ?? null],
    queryFn: () => fetchMyTrade(user!.id),
    enabled: Boolean(user?.id),
  });

  const rows = q.data ?? [];

  // PDF Download function
  const downloadPDF = () => {
    if (!rows.length) return;
    const body = [
      ["Date", "Type", "Country", "Category", "Product", "Amount (৳)", "Tax (৳)"],
      ...rows.map((r) => [
        new Date(r.created_at).toLocaleDateString("en-GB"),
        r.type,
        r.country,
        r.product_category,
        r.product_name,
        formatBDT(r.amount),
        formatBDT(r.calculated_tax),
      ]),
    ];

    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      content: [
        { text: "NEXT TAX Import / Export", style: "header" },
        { text: `Generated: ${new Date().toLocaleString()}\n\n`, style: "subheader" },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "auto", "auto", "*", "auto", "auto"],
            body: body,
          },
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true, alignment: "center", margin: [0, 0, 0, 10] },
        subheader: { fontSize: 10, italics: true, alignment: "center", margin: [0, 0, 0, 10] },
      },
    };

    pdfMake.createPdf(docDefinition).download("NEXT_TAX_Import_Export.pdf");
  };

  return (
    <AppShell>
      <div className="container py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Import / Export History</h1>
            <p className="mt-2 text-muted-foreground">Your saved import/export records.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadPDF} disabled={rows.length === 0}>
              Download PDF
            </Button>
            <Button asChild>
              <a href="/trade">New record</a>
            </Button>
          </div>
        </div>

        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Records</CardTitle>
            <div className="text-sm text-muted-foreground">{q.isLoading ? "Loading..." : `${rows.length} records`}</div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
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
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No records yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.slice(0, 40).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{new Date(r.created_at).toLocaleDateString("en-GB")}</TableCell>
                        <TableCell className="capitalize">{r.type}</TableCell>
                        <TableCell>{r.country}</TableCell>
                        <TableCell>{r.product_category}</TableCell>
                        <TableCell>{r.product_name}</TableCell>
                        <TableCell className="text-right">৳ {formatBDT(Number(r.amount))}</TableCell>
                        <TableCell className="text-right font-medium">৳ {formatBDT(Number(r.calculated_tax))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
