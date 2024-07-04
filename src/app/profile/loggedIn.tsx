"use client";

import Interests from "@/components/interests";
import { Compass, Loader } from "lucide-react";
import Link from "next/link";
import { user } from "../types/types";
import { motion } from "framer-motion";
import { useUserContext } from "@/store/context";
import { ProfileAnalytics } from "./details";
function AnimatedInterests({ user }: { user: user }) {
  const { loader } = useUserContext();
  return (
    <div className=" flex flex-col items-center gap-1">
      <motion.div
        initial={{ y: "5dvh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 1,
          type: "spring",
          stiffness: 45,
        }}
        exit={{ y: "5dvh", opacity: 0 }}
      >
        <Interests
          className="text-zinc-400 hover:text-zinc-200"
          user={user}
          isOpen={user.usersDoc.interests.length < 2 ? true : false}
        />
      </motion.div>
      <motion.div
        initial={{ y: "5dvh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 1,
          type: "spring",
          stiffness: 45,
        }}
        exit={{ y: "5dvh", opacity: 0 }}
      >
        <Link href={"/discover"}>
          <Compass className=" h-[1.4rem] w-[1.4rem] ml-0.5 text-zinc-400 hover:text-zinc-200" />
        </Link>
        <ProfileAnalytics user={user} />
        {loader && (
          <div className="pt-2.5 text-zinc-400 ml-0.5">
            <Loader className=" animate-spin h-[1.4rem] w-[1.4rem] " />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AnimatedInterests;
