import { Instagram, Twitter, Youtube, Twitch, MessageSquare, Music } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SocialLinksProps = {
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    twitch?: string;
    youtube?: string;
    discord?: string;
    tiktok?: string;
  };
  className?: string;
};

export function SocialLinks({ socialLinks, className = "" }: SocialLinksProps) {
  if (!socialLinks) return null;

  const links = [
    {
      name: "Instagram",
      url: socialLinks.instagram,
      icon: <Instagram size={20} />,
    },
    {
      name: "Twitter",
      url: socialLinks.twitter,
      icon: <Twitter size={20} />,
    },
    {
      name: "YouTube",
      url: socialLinks.youtube,
      icon: <Youtube size={20} />,
    },
    {
      name: "Twitch",
      url: socialLinks.twitch,
      icon: <Twitch size={20} />,
    },
    {
      name: "Discord",
      url: socialLinks.discord,
      icon: <MessageSquare size={20} />,
    },
    {
      name: "TikTok",
      url: socialLinks.tiktok,
      icon: <Music size={20} />,
    },
  ].filter((link) => link.url);

  if (links.length === 0) return null;

  return (
    <div className={`flex gap-2 ${className}`}>
      <TooltipProvider>
        {links.map((link) => (
          <Tooltip key={link.name}>
            <TooltipTrigger asChild>
              <Link
                href={link.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {link.icon}
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{link.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
} 