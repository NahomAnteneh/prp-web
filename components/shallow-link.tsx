import Link, { LinkProps } from "next/link";
import { PropsWithChildren } from "react";

export type ShallowLinkProps = PropsWithChildren<LinkProps>;

export default function ShallowLink({ children, ...props }: ShallowLinkProps) {
  return (
    <Link shallow {...props}>
      {children}
    </Link>
  );
}
