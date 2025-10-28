import { Dimensions, Image, View } from "react-native";
import Carousel from "react-native-reanimated-carousel";
const { width } = Dimensions.get("window");
const data = [
  require("../../assets/images/carousel/background01.jpg"),
  require("../../assets/images/carousel/background02.jpg"),
  require("../../assets/images/carousel/background03.jpg"),
  require("../../assets/images/carousel/background04.png"),
];
export default function CarouselCustom() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <Carousel
        width={width - 20}
        height={200}
        autoPlay={true}
        data={data}
        scrollAnimationDuration={2000}
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <Image
              source={item}
              style={{
                width: "100%",
                height: "100%",
                resizeMode: "cover",
              }}
            />
          </View>
        )}
      />
    </View>
  );
}
