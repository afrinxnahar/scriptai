"use client"

import React, { useState } from "react"
import { navItem } from "@repo/ui"
import Image from "next/image"
import Link from "next/link"
import logo from "@/public/dark-logo.png"
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { useRouter } from "next/navigation"


const Logo = () => (
  <Link
    href="#"
    className="flex items-center space-x-2 px-2 py-1 text-sm font-medium text-black dark:text-white"
  >
    <Image src={logo} alt="Logo" width={30} height={30} />
  </Link>
)

const LandingPageNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative w-full">
      <Navbar>
        <NavBody>
          <Link
            href="/"
            className="relative z-20 flex items-center px-2 py-1 text-sm font-normal text-black"
          >
            <Image src={logo} alt="Logo" width={30} height={30} />
            <span className="font-bold text-xl text-black dark:text-white">Creator AI</span>
          </Link>
          <NavItems items={navItem} />
          <div className="flex items-center gap-4">
            <ShimmerButton className="text-sm h-9" onClick={() => router.push("/signup")}>
              Get Started
            </ShimmerButton>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <Logo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItem.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-neutral-600 dark:text-neutral-300"
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col gap-4 mt-4">
              <NavbarButton
                variant="secondary"
                className="w-full"
              >
                <ShimmerButton className="text-sm h-9" onClick={() => router.push("https://cal.com/afrin/30min")}>
                  Book a Call
                </ShimmerButton>
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

    </div>
  )
}

export default LandingPageNavbar