"use client";

import SignIn from "./sign_in";
import User from "./user";
import CreditsDisplay from "./credits-display";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";

export default function SignToggle() {
  const t = useTranslations();
  const { user } = useAppContext();

  return (
    <div className="flex items-center gap-x-2 px-2">
      {user ? (
        <>
          <CreditsDisplay />
          <User user={user} />
        </>
      ) : (
        <SignIn />
      )}
    </div>
  );
}
