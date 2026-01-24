import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import nishat from "@/assets/team/nishat.jpg";
import fahad from "@/assets/team/fahad.jpg";
import rayhan from "@/assets/team/rayhan.jpg";
import raisul from "@/assets/team/raisul.jpg";
import esha from "@/assets/team/esha.jpg";
import { useI18n } from "@/providers/i18n-provider";

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
    <Card className={`overflow-hidden ${highlight ? "shadow-xl border-primary/20" : "shadow-md border"}`}>
      <CardHeader className="flex flex-col items-center">
        <div
          className={`overflow-hidden rounded-full ${
            highlight ? "h-28 w-28 ring-2 ring-primary/30" : "h-20 w-20 ring-1 ring-border"
          }`}
        >
          <img src={m.image} alt={`${m.name} photo`} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <CardTitle className={`${highlight ? "text-xl mt-4 text-center" : "text-base mt-2"}`}>{m.name}</CardTitle>
      </CardHeader>
      <CardContent className={`${highlight ? "text-center" : "text-left"}`}>
        <div className="text-sm text-muted-foreground">{m.role}</div>
        {m.link && (
          <Button asChild variant="outline" size="sm" className="mt-3">
            <a href={m.link} target="_blank" rel="noreferrer">
              Website
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeamPage() {
  const { t } = useI18n();

  return (
    <AppShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/80 to-primary/50 py-12">
        <div className="container mx-auto px-4">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{t("team.title")}</h1>
            <p className="mt-2 text-gray-100 max-w-2xl mx-auto">{t("team.subtitle")}</p>
          </div>

          {/* Top Member */}
          <div className="mx-auto max-w-xs md:max-w-sm mb-12">
            <MemberCard m={topMember} highlight />
          </div>

          {/* Other Members */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2">
            {members.map((m) => (
              <MemberCard key={m.name} m={m} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
