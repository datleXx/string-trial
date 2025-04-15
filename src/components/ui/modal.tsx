"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import type { ClassValue } from "clsx";

const modalSizes = {
  sm: "sm:max-w-sm",
  default: "sm:max-w-lg",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-2xl",
  "2xl": "sm:max-w-3xl",
  "3xl": "sm:max-w-4xl",
  "4xl": "sm:max-w-5xl",
  "5xl": "sm:max-w-6xl",
  full: "sm:max-w-[calc(100%-4rem)]",
} as const;

type ModalSize = keyof typeof modalSizes;

interface ModalProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  children: React.ReactNode;
}

interface ModalContentProps
  extends Omit<
    React.ComponentProps<typeof DialogPrimitive.Content>,
    "className"
  > {
  size?: ModalSize;
  className?: ClassValue;
}

interface BaseProps {
  className?: ClassValue;
}

export function Modal({ children, ...props }: ModalProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}

export function ModalTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />;
}

export function ModalContent({
  className,
  children,
  size = "default",
  ...props
}: ModalContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          "bg-background fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "rounded-lg",
          modalSizes[size],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function ModalHeader({
  className,
  ...props
}: React.ComponentProps<"div"> & BaseProps) {
  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

export function ModalFooter({
  className,
  ...props
}: React.ComponentProps<"div"> & BaseProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function ModalTitle({
  className,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Title>, "className"> &
  BaseProps) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

export function ModalDescription({
  className,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Description>, "className"> &
  BaseProps) {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export function ModalClose({
  className,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Close>, "className"> &
  BaseProps) {
  return <DialogPrimitive.Close className={cn(className)} {...props} />;
}
