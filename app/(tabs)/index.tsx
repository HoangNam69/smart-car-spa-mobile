import CarouselCustom from "@/components/carousel/CarouselCustom";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import AIChatbotWidget from "@/components/ai-chatbot/AIChatbotWidget";
import { Image, View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  
  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo/logo-sider.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <CarouselCustom />
        </View>

        {/* Featured Products Section */}
        <FeaturedProductsSection />
      </ScrollView>
      
      {/* AI Chatbot Widget */}
      <AIChatbotWidget position="bottom-right" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  logo: {
    width: 200,
  },
  carouselContainer: {
    marginBottom: 0,
  },
});
