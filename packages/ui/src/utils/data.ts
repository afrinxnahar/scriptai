interface NavItem {
  name: string
  href: string
}

interface FooterSection {
  [category: string]: NavItem[]
}

export const navItem: NavItem[] = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
]

export const footerItems: FooterSection = {
  "Product": [
    { name: "Features", href: "./#features" },
    { name: "Pricing", href: "./#pricing" },
    { name: "Book a Call", href: "https://cal.com/afrin/30min" },
  ],
  "Account": [
    { name: "Login", href: "/login" },
    { name: "Sign Up", href: "/signup" },
  ],
  "Legal": [
    { name: "Privacy Policy", href: "/privacy" },
  ],
}

export const issueTypes = [
  { value: "Bug Report", label: "Bug Report" },
  { value: "Feature Request", label: "Feature Request" },
  { value: "Other", label: "Other" },
]

