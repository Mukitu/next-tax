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
    <Card className={highlight ? "shadow-[var(--shadow-elev)]" : ""}>
      <CardHeader>
        <div className={highlight ? "mx-auto h-24 w-24 overflow-hidden rounded-full ring-2 ring-primary/30" : "h-16 w-16 overflow-hidden rounded-full ring-1 ring-border"}>
          <img src={m.image} alt={`${m.name} photo`} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <CardTitle className={highlight ? "text-center text-xl" : "text-base"}>{m.name}</CardTitle>
      </CardHeader>
      <CardContent className={highlight ? "text-center" : ""}>
        <div className="text-sm text-muted-foreground">{m.role}</div>
        {m.link ? (
          <Button asChild variant="outline" size="sm" className="mt-4">
            <a href={m.link} target="_blank" rel="noreferrer">
              Website
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function TeamPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-90" style={{ background: "var(--gradient-primary)" }} aria-hidden="true" />
        <div className="absolute inset-0 bg-background/75" aria-hidden="true" />

        <div className="container relative py-10">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("team.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("team.subtitle")}</p>
          </div>

          <div className="mx-auto max-w-2xl">
            <MemberCard m={topMember} highlight />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {members.slice(0, 2).map((m) => (
              <MemberCard key={m.name} m={m} />
            ))}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {members.slice(2).map((m) => (
              <MemberCard key={m.name} m={m} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
