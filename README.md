# Smart Car SPA Mobile 🚗

Ứng dụng di động cho hệ thống Smart Car SPA được phát triển với [Expo](https://expo.dev) và React Native.

## Bắt đầu

### Cài đặt

1. Cài đặt dependencies

   ```bash
   npm install
   ```

2. Khởi chạy ứng dụng

   ```bash
   npx expo start
   ```

### Chạy ứng dụng

Bạn có thể mở ứng dụng trên:

- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go) - ứng dụng sandbox để test

Bạn có thể bắt đầu phát triển bằng cách chỉnh sửa các file trong thư mục **app**. Dự án này sử dụng [file-based routing](https://docs.expo.dev/router/introduction).

## Quy tắc Commit

Dự án này sử dụng [Conventional Commits](https://www.conventionalcommits.org/) để đảm bảo lịch sử commit rõ ràng và dễ theo dõi.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: Tính năng mới
- **fix**: Sửa lỗi
- **docs**: Cập nhật tài liệu
- **style**: Thay đổi format code (không ảnh hưởng logic)
- **refactor**: Refactor code
- **perf**: Cải thiện hiệu suất
- **test**: Thêm hoặc sửa test
- **chore**: Cập nhật build tools, dependencies, etc.
- **ci**: Cập nhật CI/CD
- **build**: Thay đổi build system
- **revert**: Revert commit trước đó

### Scopes (tùy chọn)

- **auth**: Xác thực người dùng
- **ui**: Giao diện người dùng
- **api**: API calls
- **navigation**: Điều hướng
- **storage**: Lưu trữ dữ liệu
- **config**: Cấu hình

### Ví dụ

```bash
# Tính năng mới
git commit -m "feat(auth): thêm đăng nhập bằng Google"

# Sửa lỗi
git commit -m "fix(ui): sửa lỗi hiển thị button trên iOS"

# Cập nhật tài liệu
git commit -m "docs: cập nhật README với hướng dẫn cài đặt"

# Refactor
git commit -m "refactor(api): tách logic API calls thành service riêng"

# Breaking change
git commit -m "feat(auth)!: thay đổi cấu trúc response API đăng nhập

BREAKING CHANGE: API đăng nhập trả về object thay vì string"
```

### Lưu ý

- Sử dụng tiếng Việt cho description
- Mô tả ngắn gọn, rõ ràng
- Sử dụng dấu chấm (.) ở cuối description
- Breaking changes phải có `!` sau type và mô tả trong footer

## Cấu trúc dự án

```
├── app/                 # App router (Expo Router)
├── components/          # Reusable components
├── constants/           # Constants và theme
├── hooks/              # Custom hooks
├── assets/             # Images, fonts, etc.
└── scripts/            # Build scripts
```

## Tài liệu tham khảo

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)
