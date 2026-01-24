"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserGuidePage() {
  return (
    <AppShell>
      <div className="container py-10 space-y-6">
        {/* Page Title */}
        <h1 className="text-3xl font-semibold tracking-tight">ব্যবহারকারীর নির্দেশিকা</h1>
        <p className="text-muted-foreground">
          এই নির্দেশিকায় আপনি NEXT TAX-এর Import/Export (Trade) Calculator এবং Tax Calculator কিভাবে ব্যবহার করবেন তা জানতে পারবেন।
        </p>

        {/* Trade / Tax Calculator Guide */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>ট্রেড / ট্যাক্স ক্যালকুলেটর ব্যবহার</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              এই ক্যালকুলেটরের মাধ্যমে আপনি আমদানি বা রপ্তানি পণ্যের জন্য শুল্ক/কর এবং মোট টাকার হিসাব করতে পারবেন।
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>প্রথমে টাইপ নির্বাচন করুন: <strong>Import</strong> বা <strong>Export</strong>।</li>
              <li>ড্রপডাউন থেকে দেশ নির্বাচন করুন। দেশ অনুযায়ী শুল্কের হার স্বয়ংক্রিয়ভাবে প্রযোজ্য হবে।</li>
              <li>পণ্যের ক্যাটেগরি নির্বাচন করুন। প্রতিটি ক্যাটেগরির আলাদা কর হার থাকে।</li>
              <li>পণ্যের নাম এবং মূল্য (Amount) ইনপুট করুন। USD-এ দিলে BDT-তে স্বয়ংক্রিয় কনভার্সন হবে।</li>
              <li>সিস্টেম স্বয়ংক্রিয়ভাবে মোট কর (Calculated Tax) এবং মোট অর্থ (Amount + Tax) দেখাবে।</li>
              <li>রেকর্ড সংরক্ষণ করতে চাইলে “Save to history” বাটনে ক্লিক করুন।</li>
              <li>পূর্বের হিসাব দেখতে চাইলে <strong>“View history”</strong> এ ক্লিক করুন। এতে আপনি পূর্বের সমস্ত রেকর্ড দেখতে পারবেন।</li>
            </ul>
          </CardContent>
        </Card>

        {/* Tax Calculator Guide */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>ব্যক্তিগত ট্যাক্স ক্যালকুলেটর ব্যবহার</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              এই ক্যালকুলেটরের মাধ্যমে আপনি আপনার ব্যক্তিগত আয় ও ব্যয়ের উপর ভিত্তি করে ট্যাক্স হিসাব করতে পারবেন এবং অফিসারের কাছে রিকোয়েস্ট পাঠাতে পারবেন।
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>ফিসকাল বছর (Fiscal Year) নির্বাচন করুন।</li>
              <li>মোট আয় (Total Income) এবং মোট ব্যয় (Total Expense) ইনপুট করুন।</li>
              <li>সিস্টেম স্বয়ংক্রিয়ভাবে করযোগ্য আয় (Taxable Income) এবং হিসাবকৃত কর (Calculated Tax) দেখাবে।</li>
              <li>আপনি চাইলে “Save to History” বাটনে ক্লিক করে হিসাব সংরক্ষণ করতে পারবেন।</li>
              <li>অফিসারের রিভিউ চাইলে “Request Officer Review” বাটনে ক্লিক করুন।</li>
              <li>সব ইনপুট রিসেট করতে “Reset” বাটন ব্যবহার করুন।</li>
              <li>Dashboard থেকে আপনি সমস্ত সংরক্ষিত ট্যাক্স হিসাবের রিপোর্ট দেখতে পারবেন।</li>
            </ul>
          </CardContent>
        </Card>

        {/* Dashboard & Trade History Tips */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>Dashboard এবং Trade History</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              NEXT TAX সিস্টেমে ব্যবহারকারী তাদের হিসাব এবং রিপোর্ট সহজে দেখতে পারবেন।
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Dashboard থেকে Tax Calculator-এর সমস্ত সংরক্ষিত রিপোর্ট দেখা যাবে।</li>
              <li>Trade / Export-Import Calculator-এর হিস্ট্রি দেখতে <strong>“View history”</strong> পেজে যেতে হবে।</li>
              <li>History পেজে প্রতিটি রেকর্ডের মোট টাকার হিসাব, কর, এবং অন্যান্য বিবরণ দেখতে পারবেন।</li>
              <li>প্রয়োজন হলে পূর্বের হিসাব পুনরায় সংরক্ষণ বা কপি করা সম্ভব।</li>
            </ul>
          </CardContent>
        </Card>

        {/* Tips & Notes */}
        <Card className="shadow-[var(--shadow-elev)]">
          <CardHeader>
            <CardTitle>টিপস ও নির্দেশনা</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>সবসময় দেশের এবং ক্যাটেগরির হার সঠিক কিনা যাচাই করুন।</li>
              <li>USD-এ ইনপুট দিলে BDT-তে স্বয়ংক্রিয় রূপান্তর হবে।</li>
              <li>রেকর্ড সংরক্ষণ করলে ভবিষ্যতে দ্রুত হিসাব দেখা যাবে।</li>
              <li>হিস্ট্রি থেকে মোট কর এবং মোট টাকার হিসাব একবারে দেখা যাবে।</li>
              <li>প্রয়োজন হলে এই পেজের সমস্ত নির্দেশনা ইংরেজিতে অনুবাদ করতে পারেন।</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
