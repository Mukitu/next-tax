import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import nishat from "@/assets/team/nishat.jpg";
import fahad from "@/assets/team/fahad.jpg";
import rayhan from "@/assets/team/rayhan.jpg";
import raisul from "@/assets/team/raisul.jpg";
import esha from "@/assets/team/esha.jpg";
import { useI18n } from "@/providers/i18n-provider";
import { motion } from "framer-motion";

type Member = {
  name: string;
  role: string;
  image: string;
  link?: string;
};

const topMember: Member = {
  name: "Mukitu Islam Nishat",
  role: "Full Stack Developer",
  image: nishat,
  link: "https://mukituislamnishat.vercel.app/",
};

const members: Member[] = [
  { name: "Fahad Bin Aref", role: "Tester/QA", image: fahad },
  { name: "Rayhan Kobir Shah", role: "Project Manager", image: rayhan },
  { name: "Md Raisul", role: "Data Manager", image: raisul },
  { name: "Israt Jahan Aisha", role: "Documentation", image: esha },
];

function MemberCard({ m, highlight }: { m: Member; highlight?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card
        className={`transition-transform duration-300 hover:scale-105 ${
          highlight ? "shadow-[var(--shadow-elev)] border-2 border-primary" : "shadow-md"
        }`}
      >
        <CardHeader className="flex flex-col items-center">
          <div
            className={`overflow-hidden rounded-full ${
              highlight ? "h-28 w-28 ring-4 ring-primary/40" : "h-20 w-20 ring-1 ring-border"
            }`}
          >
            <img
              src={m.image}
              alt={`${m.name} photo`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <CardTitle className={`mt-3 text-center ${highlight ? "text-xl font-bold" : "text-base font-medium"}`}>
            {m.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center gap-2">
          <div className="text-sm text-muted-foreground">{m.role}</div>
          {m.link && (
            <Button asChild variant={highlight ? "default" : "outline"} size="sm" className="mt-2">
              <a href={m.link} target="_blank" rel="noreferrer">
                Website
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TeamPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <section className="relative overflow-hidden py-16">
        {/* Background Gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-80"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-background/70" aria-hidden="true" />

        <div className="container relative mx-auto px-4">
          {/* Header */}
          <div className="mb-12 text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-white tracking-tight"
            >
              {t("team.title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-3 text-gray-100 max-w-2xl mx-auto"
            >
              {t("team.subtitle")}
            </motion.p>
          </div>

          {/* Top Member */}
          <div className="mx-auto max-w-xs md:max-w-sm">
            <MemberCard m={topMember} highlight />
          </div>

          {/* Other Members Grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {members.map((m) => (
              <MemberCard key={m.name} m={m} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
