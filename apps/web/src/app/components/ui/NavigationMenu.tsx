import type { ReactNode } from "react";

type NavigationMenuProps = {
  children: ReactNode;
};

const NavigationMenu = ({ children }: NavigationMenuProps) => <>{children}</>;

export default NavigationMenu;
