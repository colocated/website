import { CubeIcon, DiscordLogoIcon, GithubLogoIcon, XLogoIcon } from "@phosphor-icons/react/dist/ssr";
import ShaderBackground from "./ShaderBackground";

function getAge(birth: Date, now: Date) {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

const links = [
  { href: "https://github.com/colocated", label: "GitHub", Icon: GithubLogoIcon },
  { href: "https://discord.com/users/324596012955992065", label: "Discord", Icon: DiscordLogoIcon },
  { href: "https://namemc.com/profile/colocated.1", label: "NameMC", Icon: CubeIcon },
  { href: "https://x.com/colocated_", label: "X", Icon: XLogoIcon },
];

export default function Home() {
  const age = getAge(new Date(Date.UTC(2005, 7, 25)), new Date());
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <ShaderBackground />
      <div className="fixed inset-0 -z-10 bg-black/70" aria-hidden />
      <div className="flex flex-col items-center gap-4 text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)]">
        <h1 className="select-none font-audiowide text-center text-3xl uppercase tracking-wide sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
          Colocated
          <sup className="ml-1 align-super font-sans text-base font-medium italic tracking-normal normal-case text-white/60 sm:text-lg md:text-xl">
            ({age})
          </sup>
        </h1>
        <p className="select-none text-center text-sm font-light italic text-white/80 sm:text-base md:text-lg lg:text-xl">
          Systems Engineer · Professional Goofball
        </p>
        <ul className="mt-2 flex items-center gap-5">
          {links.map(({ href, label, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="inline-flex text-white/70 transition-colors hover:text-white"
              >
                <Icon size={28} weight="regular" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
