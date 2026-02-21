
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
  const allLinks = Object.values(footerItems).flat();
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-3">
              <Image src={logo} alt="Creator AI Logo" width={40} height={40} />
              <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">Creator AI</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
              Personalized AI assistant for content creators.
            </p>


          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Footer">
            {allLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-slate-600 dark:text-slate-400 dark:hover:text-slate-100 transition-colors hover:text-purple-500"
              >
                {item.name}
              </Link>
            ))}

            <ReportIssue useIcon={false} />
          </nav>

          <div className="relative mb-8 mt-6">
            <FloatingDock
              desktopClassName='bg-transparent'
              items={socialLinks.map((item) => ({
                title: item.name,
                icon: <item.icon className="h-5 w-5 text-slate-500 dark:text-slate-400 hover:text-purple-500" />,
                href: item.href,
              }))}
            />

            {/* <p className="text-sm max-w-sm mt-3">
              Connect with us:  <a href="mailto:support@tryscriptai.com" className="text-purple-500 hover:underline">support@tryscriptai.com</a>
            </p> */}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 w-full pt-8 text-sm text-slate-600 dark:text-slate-400 flex flex-col items-center gap-2">
            &copy; {new Date().getFullYear()} Creator AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;