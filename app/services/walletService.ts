import { useAppKit } from "@reown/appkit-wagmi-react-native";

export const useWalletService = () => {
  const { open } = useAppKit();

  return {
    open,
  };
};
