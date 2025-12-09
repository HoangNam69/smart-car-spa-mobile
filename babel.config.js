module.exports = function (api) {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            "react-native-reanimated/plugin", // Phải để ở cuối cùng để tránh crash và các animation không hoạt động đúng
        ],
    };
};