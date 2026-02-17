
import React from 'react';
import Image from "next/image";
import Link from 'next/link';
import logo from "@/public/dark-logo.png";
import { IconBrandDiscordFilled as Discord, IconBrandInstagram as Instagram, IconBrandLinkedin as Linkedin, IconBrandX as Twitter, IconBrandGithub as Github, IconBrandFacebook as Facebook } from '@tabler/icons-react';
import { footerItems } from '@repo/ui';
import { FloatingDock } from "@/components/ui/floating-dock";
import ReportIssue from './issue/report-an-issue';

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/your-profile', icon: Twitter },
  { name: 'Discord', href: 'https://discord.gg/k9sZcq2gNG', icon: Discord },
  { name: 'GitHub', href: 'https://github.com/scriptaiapp/scriptai', icon: Github },
  { name: 'LinkedIn', href: 'https://linkedin.com/in/your-profile', icon: Linkedin },
  { name: 'Instagram', href: 'https://instagram.com/your-profile', icon: Instagram },
  { name: 'Facebook', href: 'https://facebook.com/your-profile', icon: Facebook },
];

const Footer = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image src={logo} alt="Script AI Logo" width={40} height={40} />
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">Script AI</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
              Personalized AI assistant for content creators.
            </p>
            <FloatingDock
              desktopClassName="bg-transparent"
              items={socialLinks.map((item) => ({
                title: item.name,
                icon: <item.icon className="h-5 w-5 text-slate-500 dark:text-slate-400 hover:text-purple-500" />,
                href: item.href,
              }))}
            />
          </div>

          {Object.entries(footerItems).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                {section}
              </h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-purple-500 dark:hover:text-slate-100 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
                {section === "Legal" && (
                  <li>
                    <ReportIssue useIcon={false} />
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Script AI. All rights reserved.
          </p>
          <a href="mailto:support@tryscriptai.com" className="text-sm text-purple-500 hover:underline">
            support@tryscriptai.com
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
