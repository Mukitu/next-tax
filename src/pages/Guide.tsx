"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GuidePage() {
  const [lang, setLang] = useState<"bn" | "en">("bn"); // ডিফল্ট Bangla

  const toggleLang = () => setLang(lang === "bn" ? "en" : "bn");

  return (
    <AppShell>
      <div className="container py-10 space-y-6">

        {/* Language Toggle Button */}
        <div className="flex justify-end">
          <Button size="sm" onClick={toggleLang}>
            {lang === "bn" ? "English দেখুন" : "বাংলা দেখুন"}
          </Button>
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
                <p>পরামর্শ: দেশ এবং ক্যাটেগরি সঠিকভাবে নির্বাচন করুন। সকল টাকার মান ডিফল্টভাবে BDT-তে দেখানো হবে, কিন্তু আপনি USD-তেও ইনপুট দিতে পারবেন।</p>
              </>
            ) : (
              <>
                <p>Welcome to NEXT TAX! This platform helps you calculate import/export duties and taxes in Bangladesh.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Trade Calculator:</strong> Select country and product category, input product value to calculate tax.</li>
                  <li><strong>History:</strong> View previous calculations, total amounts, and download as PDF.</li>
                </ul>
                <p>Tips: Always select country and category correctly. All amounts are shown in BDT by default, but you can input in USD.</p>
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
                <li><strong>টাইপ</strong> নির্বাচন করুন (আমদানি বা রপ্তানি)।</li>
                <li>ড্রপডাউন থেকে <strong>দেশ</strong> নির্বাচন করুন।</li>
                <li><strong>প্রোডাক্ট ক্যাটেগরি</strong> নির্বাচন করুন।</li>
                <li><strong>প্রোডাক্ট নাম</strong> এবং <strong>মূল্য</strong> ইনপুট করুন।</li>
                <li>ক্যালকুলেটর দেখাবে <strong>দেশের রেট, ক্যাটেগরির রেট, মোট রেট</strong> এবং <strong>হিসাবকৃত কর</strong>।</li>
                <li>আপনি এই রেকর্ডটি ইতিহাসে সংরক্ষণ করতে পারেন পরে রেফারেন্সের জন্য।</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                <li>Select <strong>Type</strong> (Import or Export).</li>
                <li>Select <strong>Country</strong> from dropdown.</li>
                <li>Select <strong>Product Category</strong>.</li>
                <li>Enter <strong>Product Name</strong> and <strong>Amount</strong>.</li>
                <li>The calculator will show <strong>Country rate, Category rate, Total rate</strong> and <strong>Calculated Tax</strong>.</li>
                <li>You can save the record for later reference in History.</li>
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
                <li>প্রতিটি রেকর্ডের <strong>টাকা, কর, এবং মোট টাকার হিসাব</strong> দেখুন।</li>
                <li>সব রেকর্ডের মোট হিসাব দেখুন।</li>
                <li>সকল হিসাবসহ PDF হিসেবে ডাউনলোড করুন।</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                <li>View all your previous calculations.</li>
                <li>See <strong>Amount, Tax, and Final Amount</strong> for each record.</li>
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
