"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/providers/i18n-provider";

export default function GuidePage() {
  const { t } = useI18n();

  return (
    <AppShell>
      <div className="container py-10 space-y-6">

        {/* General Guide Card */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{t("guide.title") || "User Guide / ব্যবহারকারীর নির্দেশিকা"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              <strong>English:</strong> Welcome to NEXT TAX! This platform allows you to calculate import/export duties and taxes for Bangladesh. You can use the two calculators:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Trade Calculator:</strong> Select the country, product category, and input the product value to calculate taxes.
              </li>
              <li>
                <strong>History:</strong> View your previous calculations, total amounts, and export them as PDF.
              </li>
            </ul>

            <p>
              <strong>বাংলা:</strong> NEXT TAX-এ স্বাগতম! এই প্ল্যাটফর্মটি আপনাকে বাংলাদেশে আমদানি/রপ্তানি শুল্ক এবং কর হিসাব করতে সাহায্য করবে। আপনি দুটি ক্যালকুলেটর ব্যবহার করতে পারেন:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>ট্রেড ক্যালকুলেটর:</strong> দেশ, প্রোডাক্ট ক্যাটেগরি নির্বাচন করে প্রোডাক্টের মূল্য ইনপুট করুন এবং কর হিসাব করুন।
              </li>
              <li>
                <strong>হিস্ট্রি:</strong> পূর্ববর্তী হিসাবগুলো দেখুন, মোট টাকার হিসাব করুন, এবং PDF হিসেবে ডাউনলোড করুন।
              </li>
            </ul>

            <p>
              <strong>Tips:</strong> Always double-check the country and category selection. All amounts are shown in BDT by default, but you can input in USD and it will convert automatically.
            </p>
            <p>
              <strong>পরামর্শ:</strong> দেশ এবং ক্যাটেগরি সঠিকভাবে নির্বাচন করুন। সকল টাকার মান ডিফল্টভাবে BDT-তে দেখানো হবে, কিন্তু আপনি USD-তেও ইনপুট দিতে পারবেন, যা স্বয়ংক্রিয়ভাবে রূপান্তরিত হবে।
            </p>
          </CardContent>
        </Card>

        {/* Trade Calculator Guide Card */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{t("guide.tradeCalculator") || "Trade Calculator Guide / ট্রেড ক্যালকুলেটর নির্দেশিকা"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              <strong>English:</strong> To use the Trade Calculator:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select <strong>Type</strong> (Import or Export).</li>
              <li>Select <strong>Country</strong> from the dropdown.</li>
              <li>Select <strong>Product Category</strong>.</li>
              <li>Enter <strong>Product Name</strong> and <strong>Amount</strong>.</li>
              <li>The calculator will display <strong>Country rate, Category rate, Total rate</strong> and <strong>Calculated Tax</strong>.</li>
              <li>You can save the record to your history for later reference.</li>
            </ul>

            <p>
              <strong>বাংলা:</strong> ট্রেড ক্যালকুলেটর ব্যবহার করার জন্য:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>টাইপ</strong> নির্বাচন করুন (আমদানি বা রপ্তানি)।</li>
              <li>ড্রপডাউন থেকে <strong>দেশ</strong> নির্বাচন করুন।</li>
              <li><strong>প্রোডাক্ট ক্যাটেগরি</strong> নির্বাচন করুন।</li>
              <li><strong>প্রোডাক্ট নাম</strong> এবং <strong>মূল্য</strong> ইনপুট করুন।</li>
              <li>ক্যালকুলেটর দেখাবে <strong>দেশের রেট, ক্যাটেগরির রেট, মোট রেট</strong> এবং <strong>হিসাবকৃত কর</strong>।</li>
              <li>আপনি এই রেকর্ডটি ইতিহাসে সংরক্ষণ করতে পারেন পরে রেফারেন্সের জন্য।</li>
            </ul>
          </CardContent>
        </Card>

        {/* History Guide Card */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>{t("guide.history") || "History Guide / হিস্ট্রি নির্দেশিকা"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              <strong>English:</strong> In the History page, you can:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>View all your past calculations.</li>
              <li>See <strong>Amount, Tax, and Final Amount</strong> for each record.</li>
              <li>Check totals for all records combined.</li>
              <li>Download the history as a PDF with all amounts.</li>
            </ul>

            <p>
              <strong>বাংলা:</strong> হিস্ট্রি পেজে আপনি করতে পারবেন:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>আপনার পূর্ববর্তী সকল হিসাব দেখুন।</li>
              <li>প্রতিটি রেকর্ডের <strong>টাকা, কর, এবং মোট টাকার হিসাব</strong> দেখুন।</li>
              <li>সব রেকর্ডের মোট হিসাব দেখুন।</li>
              <li>সকল হিসাবসহ PDF হিসেবে ডাউনলোড করুন।</li>
            </ul>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
