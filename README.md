# Super Mario Bros. (1985) — 100% Authentic NES Remake

Bản làm lại (remake) **100% chuẩn thông số phần cứng NES/Famicom 1985** của tựa game huyền thoại **Super Mario Bros. (1985)**, xây dựng bằng **TypeScript + HTML5 Canvas + Web Audio API** với kiến trúc **OOP kết hợp Data-Driven Tilemap**, vòng lặp vật lý cố định **60 FPS Fixed-Timestep**, hệ thống tọa độ **Sub-Pixel `1/256 px`**, và đầy đủ **32 màn chơi (`World 1-1` đến `World 8-4`)**.

---

## 1. Tính Năng Cốt Lõi (100% Authentic 1985 Specs)

- **Vật lý Sub-Pixel Chuẩn NES (`1/256 px` Fixed-Point)**:
  - Gia tốc đi bộ (`Walk`), chạy nước rút (`Run` - giữ nút `B`), quán tính trượt phanh (`Skidding`) khi đổi hướng đột ngột.
  - **Nhảy biến thiên 3 ngưỡng tốc độ (`Variable Jump Height`)**: Trọng lực giữ phím `A` thấp hơn ~3.5 lần so với khi nhả phím `A`, nhảy cao hơn khi đang chạy nhanh.
  - **3 trạng thái nhân vật**: `Small Mario`, `Super Mario`, `Fire Mario` (bắn tối đa 2 viên đạn lửa nảy trên mặt đất), kết hợp bất tử `Starman` và nhấp nháy `Invincibility Frames` sau khi nhận sát thương.
- **Hệ thống Tilemap, Vật phẩm & Tương tác Môi trường**:
  - `Brick Block` (nảy lên khi Small Mario đụng, vỡ thành 4 mảnh rơi parabol khi Super/Fire Mario đụng, hoặc gạch 10 xu `multi-coin-10`), `Question Block (?)`, `Hidden Block (H)`.
  - Đầy đủ vật phẩm: `Super Mushroom`, `Fire Flower`, `Starman`, `1-Up Mushroom`, `Spinning Coin`, `Beanstalk / Vine` (dây leo mọc lên mây dẫn tới `Coin Heaven`).
  - `Warp Pipes` (chui dọc/ngang dẫn xuống phòng thưởng ngầm, khu vực dưới nước, hoặc **Warp Zone** tại `1-2` và `4-2`).
  - `Moving Platforms`: Thang máy dọc lặp vòng (`vertical-loopUp/Down`), dao động (`oscillate`), bệ rơi (`fall-on-stand`), bệ mây (`right-on-stand`) và **bập bênh ròng rọc (`scale-balance-pair`)** đứt dây cộng `1000` điểm.
  - `Flagpole`: Tính điểm theo độ cao chạm cờ (`100` → `5000` điểm) + tự động bắn **1, 3 hoặc 6 phát pháo hoa** (`+500` điểm/phát) khi chữ số cuối của đồng hồ là `1`, `3` hoặc `6`.
- **Toàn bộ Danh sách Kẻ địch & Trùm Bowser**:
  - `Goomba`, `Koopa Troopa` (Xanh & Đỏ tự quay đầu ở mép vực + cơ chế đá mai rùa nảy tường tiêu diệt dây chuyền), `Paratroopa`, `Piranha Plant` (tự động ngừng nhô khi Mario đứng sát ống), `Buzzy Beetle` (miễn nhiễm đạn lửa), `Lakitu & Spiny`, `Hammer Bros`, `Bullet Bill`, `Blooper`, `Cheep-Cheep`, `Podoboo`, bẫy thanh lửa xoay `Fire-Bar` (6 viên & 12 viên).
  - **Trùm King Bowser**: Khạc lửa định hướng, nhảy, ném búa (từ `World 6-4` trở đi); tiêu diệt bằng cách chạm rìu (`Axe`) làm sập cầu từng nhịp hoặc bắn 5 viên đạn lửa làm lộ nguyên hình kẻ địch giả dạng (`World 1` → `World 7`).
- **Toàn bộ 32 Màn chơi (`World 1-1` đến `World 8-4`) & Mê cung Lặp vòng**:
  - Đầy đủ 32 màn chính + 18 Sub-World (`Bonus Rooms`, `Coin Heavens`, `Underwater Sub-Worlds`, `Warp Zones`).
  - Cơ chế **Lâu đài Mê cung Lặp vòng (`CastleMazeLoopController`)** tại `4-4`, `7-4` và `8-4` (kết hợp giải đố ống nước & hồ nước ngầm ở `8-4` giải cứu Công chúa Peach + mở khóa **Second Quest / Hard Mode**).
- **Giao diện HUD, Title Screen & Bộ Tổng hợp Âm thanh 8-Bit (Web Audio API)**:
  - Màn hình `Title Screen` (chọn 1/2 Players, lưu `Top Score`, chế độ **Attract-Mode Demo** tự chạy), màn hình báo `WORLD X-Y / Lives`, `TIME UP`, `GAME OVER` và `QUEST COMPLETE`.
  - Bộ tổng hợp âm thanh **8-Bit NES APU Synthesizer** (`Square`, `Triangle`, `Noise`) tạo trực tiếp 9 bản nhạc nền (`Overworld`, `Underground`, `Underwater`, `Castle`, `Starman`, `Coin Heaven`, `Level Clear`, `World Clear`, `Game Over` + tăng tốc `Hurry-Up` khi `TIME <= 100`) và 20 hiệu ứng âm thanh `SFX` mà không cần bất kỳ file âm thanh ngoài nào.

---

## 2. Cấu Trúc Thư Mục Dự Án

```text
super-mario-bros-1985/
├── index.html                              # Giao diện máy NES 256×240 upscale Pixel-Art + Telemetry + Toolbar
├── package.json                            # Scripts: dev, build, test
├── tsconfig.json                           # Cấu hình TypeScript Strict Mode
├── scripts/
│   ├── dev-server.mjs                      # Máy chủ HTTP Dev biên dịch TypeScript tức thời
│   └── build.mjs                           # Trình đóng gói Production sang thư mục dist/
└── src/
    ├── main.ts                             # Điểm khởi chạy ứng dụng & gắn kết DOM/Controls
    ├── types/
    │   ├── physics-constants.ts            # Hằng số vật lý Sub-Pixel 1/256 px & bảng điểm chuẩn NES 1985
    │   └── level-schema.ts                 # Schema định nghĩa màn chơi Data-Driven cho 32 màn
    ├── core/
    │   ├── GameEngine.ts                   # Vòng lặp vật lý 60 FPS Fixed-Timestep & điều phối toàn cục
    │   ├── InputManager.ts                 # Bộ đọc phím NES (Left/Right/Down/A/B/Start/Select) & Virtual Pad
    │   ├── Camera.ts                       # Camera chỉ cuộn sang phải (One-Way Horizontal Scrolling)
    │   └── EventBus.ts                     # Hệ thống sự kiện định kiểu mạnh (Typed Event Bus)
    ├── physics/
    │   ├── SubPixelPhysics.ts              # Toán học Fixed-Point 1/256 px & kiểm tra giao cắt AABB
    │   └── TileCollisionSolver.ts          # Giải quyết va chạm lưới Tilemap 16×16, nảy/vỡ gạch & Score Popups
    ├── entities/
    │   ├── player/
    │   │   ├── Mario.ts                    # Nhân vật Mario (Sub-Pixel Walk/Run/Skid/Jump/Swim/Vine/Flagpole)
    │   │   └── Fireball.ts                 # Đạn lửa của Fire Mario
    │   ├── items/
    │   │   ├── PowerUpItem.ts              # Super Mushroom, Fire Flower, Starman, 1-Up Mushroom, Vine
    │   │   ├── SpinningCoin.ts             # Hiệu ứng đồng xu xoay nảy lên từ khối ? / gạch 10 xu
    │   │   └── ItemManager.ts              # Quản lý vật phẩm & hiệu ứng đẩy bật khi đụng gạch bên dưới
    │   └── enemies/
    │       ├── EnemyEntity.ts              # AI cho toàn bộ 12 loài kẻ địch & Trùm King Bowser 32×32
    │       ├── EnemyProjectiles.ts         # Đạn búa parabol (Hammer) & Luồng lửa Bowser (Fire Breath)
    │       └── EnemyManager.ts             # Kích hoạt kẻ địch theo Camera, chuỗi điểm Combo & Sập cầu Rìu
    ├── world/
    │   ├── TilemapLoader.ts                # Giải mã ma trận 15 hàng / RLE & lưu trạng thái Main/Sub-World
    │   ├── LevelManager.ts                 # Quản lý 32 màn chơi (1-1 .. 8-4) & giải mã Warp Zone
    │   ├── WarpPipeController.ts           # Hoạt cảnh chui ống nước dọc/ngang & chuyển vùng
    │   ├── MovingPlatformController.ts     # 7 loại thang máy, bệ rơi, bệ mây & bập bênh ròng rọc
    │   ├── FlagpoleSequenceController.ts   # Hoạt cảnh kéo cờ, đi vào lâu đài, đếm điểm thời gian & pháo hoa
    │   ├── CastleMazeLoopController.ts     # Mê cung lặp vòng cho các màn 4-4, 7-4 và 8-4
    │   └── FireBarHazard.ts                # Bẫy thanh lửa xoay (6 viên & 12 viên)
    ├── levels/
    │   ├── StageBuilder.ts                 # DSL dựng ma trận màn chơi 15 hàng chuẩn NES
    │   ├── TestStage1_1.ts                 # Dữ liệu chuẩn World 1-1 & phòng ngầm 1-1-bonus
    │   ├── World1Levels.ts                 # Toàn bộ dữ liệu World 1 (1-1, 1-2 + Warp Zone, 1-3, 1-4)
    │   ├── World2Levels.ts                 # Toàn bộ dữ liệu World 2 (2-1 + Coin Heaven, 2-2, 2-3, 2-4)
    │   ├── World3Levels.ts                 # Toàn bộ dữ liệu World 3 (3-1, 3-2, 3-3, 3-4)
    │   ├── World4Levels.ts                 # Toàn bộ dữ liệu World 4 (4-1, 4-2 Dual Warp Zone, 4-3, 4-4 Maze)
    │   ├── World5Levels.ts                 # Toàn bộ dữ liệu World 5 (5-1, 5-2, 5-3, 5-4)
    │   ├── World6Levels.ts                 # Toàn bộ dữ liệu World 6 (6-1, 6-2, 6-3, 6-4 Hammer Bowser)
    │   ├── World7Levels.ts                 # Toàn bộ dữ liệu World 7 (7-1, 7-2, 7-3, 7-4 2-Stage Maze)
    │   └── World8Levels.ts                 # Toàn bộ dữ liệu World 8 (8-1, 8-2, 8-3, 8-4 Peach Finale)
    ├── audio/
    │   └── NesAudioSynthesizer.ts          # Bộ tổng hợp âm thanh 8-Bit Chiptune (9 BGM + 20 SFX)
    ├── ui/
    │   └── GameScreenStateMachine.ts       # Title Screen, Attract Demo, World Intro, Game Over, Quest Complete
    ├── rendering/
    │   ├── NesPalette.ts                   # Bảng màu chuẩn NES 2C02 PPU cho 5 kiểu môi trường (Biomes)
    │   ├── PixelSpriteAtlas.ts             # Vẽ Pixel-Art 16×16 cho toàn bộ khối, vật phẩm, kẻ địch & Mario
    │   └── Renderer.ts                     # Pipeline kết xuất khung hình 256×240, cảnh nền, HUD & Popups
    └── __tests__/                          # 34 bài kiểm thử tự động (Unit & Integration Tests) cho cả 6 Giai đoạn
```

---

## 3. Hướng Dẫn Chạy & Kiểm Thử Dự Án

### Chạy máy chủ chơi thử trực tiếp (Dev Server)
```bash
cd /home/datnt/super-mario-bros-1985
npm run dev
```
Sau đó mở trình duyệt tại địa chỉ hiển thị trên terminal (mặc định `http://localhost:5173`).

### Phím Điều Khiển (Controls)
- **Di chuyển Trái / Phải**: `← / →` hoặc `A / D`
- **Ngồi (Crouch) / Chui ống đứng**: `↓` hoặc `S`
- **Chạy nước rút (Run) / Bắn đạn lửa (Fireball) — Nút B**: `Shift`, `X`, hoặc `J`
- **Nhảy biến thiên (Variable Jump) / Bơi dưới nước — Nút A**: `Space`, `Z`, hoặc `K`
- **Tạm dừng (Pause) / Bắt đầu Game (Start)**: `Enter`
- **Đổi 1/2 Người chơi ở Title Screen (Select)**: `Tab`
- **Thanh công cụ nhanh trên giao diện**: Chọn nhanh bất kỳ màn nào từ `World 1-1` đến `World 8-4`, bật/tắt `Title Screen`, bật/tắt âm thanh `8-Bit Audio`, hoặc thử nghiệm nhanh các trạng thái `Small` (`[1]`), `Super` (`[2]`), `Fire` (`[3]`), `Starman` (`[I]`), `Reset` (`[R]`).

### Chạy Kiểm Thử Tự Động & Đóng Gói Production
```bash
# Chạy toàn bộ bộ kiểm thử tự động (Phases 1 → 6)
npm test

# Đóng gói bản dựng Production ra thư mục dist/
npm run build
```
