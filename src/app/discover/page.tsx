import { getDiscover } from "@/action/getDiscover";
import { getLoggedInUser } from "@/lib/server/appwrite";
import Profile from "./profile";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Discover",
    description: "Get a matching profile by uploading images with AI",
    keywords:
      "Upload profile images, Profile image management, Create and manage profiles, Social media links, Personal branding, Bio link page, Profile customization, Image upload feature, Manage social profiles",
    icons: [{ rel: "icon", url: "/favicon.webp" }],
    openGraph: {
      title: "ImageMatch ",
      description: "Get a matching profile by uploading images with AI",
      url: "https://ImageMatch.vercel.app",
      type: "website",
      images: [
        {
          url: "https://ImageMatch.vercel.app/favicon.webp",
          width: 1200,
          height: 630,
          alt: "ImageMatch OG Image",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@tanmay11117",
      title: "Discover ",
      description: "Get a matching profile by uploading images with AI",
      images: "https://ImageMatch.vercel.app/favicon.webp",
    },
  };
}

async function page() {
  const discover = await getDiscover();
  const user = await getLoggedInUser();
  return (
    <Profile
      discover={
        user ? discover.filter((u) => user && u.$id !== user.$id) : discover
      }
      loggedIn={user}
    />
  );
}

export default page;
