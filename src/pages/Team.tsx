import { AppShell } from "@/components/layout/AppShell";
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
  size?: "sm" | "md";
};

const hexClip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const topRow: Member[] = [
  {
    name: "Rayhan",
    role: "Designer",
    image: rayhan,
    size: "sm",
  },
  {
    name: "Mukitu",
    role: "Full Stack Developer",
    image: nishat,
    size: "sm",
    link: "https://mukituislamnishat.vercel.app/",
  },
];

const bottomRow: Member[] = [
  {
    name: "Raisul",
    role: "Content Writer",
    image: raisul,
    size: "sm",
  },
  {
    name: "Fahad",
    role: "Team Leader",
    image: fahad,
    size: "md",
  },
  {
    name: "Aisha",
    role: "Documentation",
    image: esha,
    size: "sm",
  },
];

function HexCard({ member }: { member: Member }) {
  const isLarge = member.size === "md";
  const imgSize = isLarge ? "w-32 h-36" : "w-24 h-28";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${imgSize} p-[3px] bg-gray-400`}
        style={{ clipPath: hexClip }}
      >
        <div
          className="w-full h-full overflow-hidden"
          style={{ clipPath: hexClip }}
        >
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      <div className="text-center">
        <p className={`text-gray-500 font-medium ${isLarge ? "text-sm" : "text-xs"}`}>
          {member.role}
        </p>
        <p className={`text-gray-900 font-bold ${isLarge ? "text-base" : "text-sm"}`}>
          {member.name}
        </p>
        {member.link && (
          <a
            href={member.link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 underline mt-1 inline-block"
          >
            Website
          </a>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { t } = useI18n();

  return (
    <AppShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 min-h-screen py-16">
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-white/20 rotate-45 pointer-events-none" />
        <div className="absolute -top-20 -right-8 w-72 h-72 bg-white/15 rotate-45 pointer-events-none" />
        <div className="absolute -bottom-20 -right-16 w-80 h-80 bg-white/10 rotate-45 pointer-events-none" />
        <div className="absolute -bottom-10 -left-12 w-48 h-48 bg-white/15 rotate-45 pointer-events-none" />

        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-extrabold tracking-widest text-gray-900 uppercase">
              {t("team.title")}
            </h1>
            <p className="mt-1 text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase">
              {t("team.subtitle")}
            </p>
          </div>

          <div className="flex justify-center gap-16 mb-12">
            {topRow.map((member) => (
              <HexCard key={member.name} member={member} />
            ))}
          </div>

          <div className="flex justify-center gap-12">
            {bottomRow.map((member) => (
              <HexCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
