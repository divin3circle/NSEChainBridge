import { Pressable, Text, TouchableOpacity } from "react-native";
import { useAppKit } from "@reown/appkit-wagmi-react-native";

export default function ConnectView() {
  const { open } = useAppKit();

  return (
    <>
      <TouchableOpacity onPress={() => open()}>
        <Text>Open Connect Modal</Text>
      </TouchableOpacity>
    </>
  );
}
