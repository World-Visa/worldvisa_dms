"use client";

import Link from "next/link";

import { Button } from "@/components/ui/primitives/button";
import { RiRocket2Fill } from "react-icons/ri";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-6 text-center">
      <h1 className="font-semibold text-4xl">Page not found.</h1>
      <p className="text-foreground-500 text-base">
        Uh oh! Looks like you’ve missed the track. <br />
        This page is lost in cyberspace.<br />
        No worries—click the button below and our virtual chauffeur will whisk you home!
      </p>
 
      <Link prefetch={false} replace href="/v2">
        <Button variant="primary" mode="filled" size="sm" className="text-sm font-medium" leadingIcon={RiRocket2Fill}>Take me home</Button>
      </Link>
    </div>
  );
}