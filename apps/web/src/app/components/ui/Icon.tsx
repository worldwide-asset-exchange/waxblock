import {
  Check,
  CircleAlert,
  CircleArrowRight,
  CircleHelp,
  Clock,
  Clipboard,
  Dices,
  DollarSign,
  Filter,
  HandCoins,
  Info,
  Key,
  Layers,
  Move,
  RefreshCw,
  Trash2,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";

const icons = {
  check: Check,
  clock: Clock,
  filter: Filter,
  info: Info,
  help: CircleHelp,
  refresh: RefreshCw,
  trash: Trash2,
  right: CircleArrowRight,
  x: X,
  alert: CircleAlert,
  clipboard: Clipboard,
  key: Key,
  user: User,
  dollar: DollarSign,
  layers: Layers,
  handCoins: HandCoins,
  wallet: Wallet,
  dice: Dices,
  trending: TrendingUp,
  move: Move,
};

type IconProps = {
  name: keyof typeof icons;
  size?: number;
  className?: string;
  color?: string;
};

const Icon = ({ name, size = 16, className, color }: IconProps) => {
  const Component = icons[name];
  return (
    <Component
      size={size}
      className={className}
      color={color}
      aria-hidden="true"
    />
  );
};

export default Icon;
