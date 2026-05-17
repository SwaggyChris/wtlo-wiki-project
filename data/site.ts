import type { LucideIcon } from "lucide-react";
import { BookOpen, Compass, Database, ExternalLink, Info, Instagram, Layers3, Map, MessageCircle, Shield, Swords, Twitch, Users, Youtube } from "lucide-react";

export type SitePage = "home" | "database" | "map" | "community" | "about" | "login" | "signup";
export type NavItem = { id: Exclude<SitePage, "home" | "login" | "signup">; label: string; href: string; icon: LucideIcon; };

export const navItems: NavItem[] = [
  { id: "database", label: "WTLO Database", href: "/database", icon: Database },
  { id: "map", label: "WTLO Map", href: "/map", icon: Map },
  { id: "community", label: "Community", href: "/community", icon: Users },
  { id: "about", label: "About Us", href: "/about", icon: Info },
];

export const socialLinks = [
  { label: "Discord", href: "#", icon: MessageCircle },
  { label: "YouTube", href: "#", icon: Youtube },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "Twitch", href: "#", icon: Twitch },
];

export const usefulResources = [
  { label: "Beginner Guide", href: "/community", icon: BookOpen },
  { label: "Interactive Map", href: "/map", icon: Compass },
  { label: "Item Database", href: "/database", icon: Layers3 },
  { label: "About WTLO Wiki", href: "/about", icon: ExternalLink },
];

export const featureColumns = {
  database: [
    { title: "Item Categories", text: "Weapons, armor, ammo, medicine, resources, and special items organized into clear categories.", icon: Database },
    { title: "Comparison Tools", text: "Future filters can let players compare stats, rarity, usage, region availability, and progression value.", icon: Layers3 },
    { title: "Search Experience", text: "This page can become the main structured search area for everything stored in the WTLO Wiki database.", icon: BookOpen },
  ],
  map: [
    { title: "Map Markers", text: "Traders, bunkers, loot areas, events, and custom categories can all live on this page.", icon: Map },
    { title: "Route Planning", text: "Players can use this page to study travel paths, safer routes, and farming movement between sectors.", icon: Compass },
    { title: "Region Awareness", text: "Danger zones, anomalies, enemy density, and risk-heavy regions can be explained visually here.", icon: Shield },
  ],
  community: [
    { title: "Guides", text: "Beginner help, advanced strategies, build advice, and progression walkthroughs can live here.", icon: BookOpen },
    { title: "Creators", text: "This page can spotlight WTLO creators, contributors, and community authors in a cleaner format.", icon: Users },
    { title: "Updates", text: "Patch notes, announcements, featured posts, and important community information can be organized here.", icon: MessageCircle },
  ],
  about: [
    { title: "Mission", text: "To build a premium knowledge hub that makes WTLO information clearer, faster to find, and easier to trust.", icon: Info },
    { title: "Community Value", text: "The wiki is meant to support both new players learning the game and experienced players refining routes, builds, and knowledge.", icon: Swords },
    { title: "Future Growth", text: "This page can later include roadmap sections, contributor credits, partnerships, and project development updates.", icon: ExternalLink },
  ],
} as const;