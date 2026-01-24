"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// @ts-ignore
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default function GuidePage() {
  const [lang, setLang] = useState<"bn" | "en">("bn"); // ডিফল্ট Bangla

  const toggleLang = () => setLang(lang === "bn" ? "en" : "bn");

  const handleDownloadPDF = () => {
    // Bangla content
    const content_bn = [
      { text: "ব্যবহারকারীর নির্দেশিকা", style: "header" },
      { text: "NEXT TAX-এ স্বাগতম! এই প্ল্যাটফর্মটি আপনাকে বাংলাদেশে আমদানি/রপ্তানি শুল্ক এবং কর হিসাব করতে সাহায্য করবে।", margin: [0, 5, 0, 5] },
      { text: "ট্রেড ক্যালকুলেটর নির্দেশিকা:", bold: true, margin: [0, 5, 0, 3] },
      { ul: [
        "টাইপ নির্বাচন করুন (আমদানি বা রপ্তানি)।",
        "ড্রপডাউন থেকে দেশ নির্বাচন করুন।",
        "প্রোডাক্ট ক্যাটেগরি নির্বাচন করুন।",
        "প্রোডাক্ট নাম এবং মূল্য ইনপুট করুন।",
        "ক্যালকুলেটর দেখাবে দেশ ও ক্যাটেগরির রেট এবং হিসাবকৃত কর।",
        "রেকর্ডটি ইতিহাসে সংরক্ষণ করুন।"
      ], margin: [0,0,0,5] },
      { text: "হিস্ট্রি নির্দেশিকা:", bold: true, margin: [0, 5, 0, 3] },
      { ul: [
        "আপনার পূর্ববর্তী সকল হিসাব দেখুন।",
        "প্রতিটি রেকর্ডের টাকা, কর, এবং মোট টাকার হিসাব দেখুন।",
        "সব রেকর্ডের মোট হিসাব দেখুন।",
        "সকল হিসাবসহ PDF হিসেবে ডাউনলোড করুন।"
      ] }
    ];

    // English content
    const content_en = [
      { text: "User Guide", style: "header" },
      { text: "Welcome to NEXT TAX! This platform helps you calculate import/export duties and taxes in Bangladesh.", margin: [0, 5, 0, 5] },
      { text: "Trade Calculator Guide:", bold: true, margin: [0, 5, 0, 3] },
      { ul: [
        "Select Type (Import or Export).",
        "Select Country from dropdown.",
        "Select Product Category.",
        "Enter Product Name and Amount.",
        "The calculator will show Country rate, Category rate, Total rate, and Calculated Tax.",
        "Save the record for later reference in History."
      ], margin: [0,0,0,5] },
      { text: "History Guide:", bold: true, margin: [0, 5, 0, 3] },
      { ul: [
        "View all your previous calculations.",
        "See Amount, Tax, and Final Amount for each record.",
        "Check totals for all records combined.",
        "Download history as PDF including all amounts."
      ] }
    ];

    const docDefinition = {
      content: lang === "bn" ? content_bn : content_en,
      defaultStyle: { font: lang === "bn" ? "Helvetica" : "Helvetica" },
      styles: {
        header: { fontSize: 18, bold: true, margin: [0,0,0,10] },
      },
    };

    pdfMake.createPdf(docDefinition).download(`NEXT_TAX_Guide_${lang}.pdf`);
  };

  return (
    <AppShell>
      <div className="container py-10 space-y-6">

        {/* Language Toggle + PDF Download */}
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={toggleLang}>
            {lang === "bn" ? "English দেখুন" : "বাংলা দেখুন"}
          </Button>
          <Button size="sm" onClick={handleDownloadPDF}>Download PDF</Button>
        </div>

        {/* General Guide Card */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{lang === "bn" ? "ব্যবহারকারীর নির্দেশিকা" : "User Guide"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            {lang === "bn" ? (
              <>
                <p>NEXT TAX-এ স্বাগতম! এই প্ল্যাটফর্মটি আপনাকে বাংলাদেশে আমদানি/রপ্তানি শুল্ক এবং কর হিসাব করতে সাহায্য করবে।</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>ট্রেড ক্যালকুলেটর:</strong> দেশ, প্রোডাক্ট ক্যাটেগরি নির্বাচন করে প্রোডাক্টের মূল্য ইনপুট করুন এবং কর হিসাব করুন।</li>
                  <li><strong>হিস্ট্রি:</strong> পূর্ববর্তী হিসাবগুলো দেখুন, মোট টাকার হিসাব করুন, এবং PDF হিসেবে ডাউনলোড করুন।</li>
                </ul>
              </>
            ) : (
              <>
                <p>Welcome to NEXT TAX! This platform helps you calculate import/export duties and taxes in Bangladesh.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Trade Calculator:</strong> Select country and product category, input product value to calculate tax.</li>
                  <li><strong>History:</strong> View previous calculations, total amounts, and download as PDF.</li>
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        {/* Trade Calculator Guide Card */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{lang === "bn" ? "ট্রেড ক্যালকুলেটর নির্দেশিকা" : "Trade Calculator Guide"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            {lang === "bn" ? (
              <ul className="list-disc list-inside space-y-1">
                <li>টাইপ নির্বাচন করুন (আমদানি বা রপ্তানি)।</li>
                <li>ড্রপডাউন থেকে দেশ নির্বাচন করুন।</li>
                <li>প্রোডাক্ট ক্যাটেগরি নির্বাচন করুন।</li>
                <li>প্রোডাক্ট নাম এবং মূল্য ইনপুট করুন।</li>
                <li>ক্যালকুলেটর দেখাবে দেশ ও ক্যাটেগরির রেট এবং হিসাবকৃত কর।</li>
                <li>রেকর্ডটি ইতিহাসে সংরক্ষণ করুন।</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                <li>Select Type (Import or Export).</li>
                <li>Select Country from dropdown.</li>
                <li>Select Product Category.</li>
                <li>Enter Product Name and Amount.</li>
                <li>The calculator will show Country rate, Category rate, Total rate, and Calculated Tax.</li>
                <li>Save the record for later reference in History.</li>
              </ul>
            )}
          </CardContent>
        </Card>

        {/* History Guide Card */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{lang === "bn" ? "হিস্ট্রি নির্দেশিকা" : "History Guide"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            {lang === "bn" ? (
              <ul className="list-disc list-inside space-y-1">
                <li>আপনার পূর্ববর্তী সকল হিসাব দেখুন।</li>
                <li>প্রতিটি রেকর্ডের টাকা, কর, এবং মোট টাকার হিসাব দেখুন।</li>
                <li>সব রেকর্ডের মোট হিসাব দেখুন।</li>
                <li>সকল হিসাবসহ PDF হিসেবে ডাউনলোড করুন।</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                <li>View all your previous calculations.</li>
                <li>See Amount, Tax, and Final Amount for each record.</li>
                <li>Check totals for all records combined.</li>
                <li>Download history as PDF including all amounts.</li>
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
