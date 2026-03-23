"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      visibleToasts={5}
      gap={10}
      offset={20}
      {...props}
    />
  );
};

export { Toaster };
