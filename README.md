# EProject Microservices (Node.js, MongoDB, RabbitMQ)

Một project demo dựa trên kiến trúc microservices được xây dựng với Node.js, MongoDB và RabbitMQ, bao gồm các dịch vụ xác thực, quản lý sản phẩm và xử lý đơn hàng.

## Tính Năng

- **Dịch vụ xác thực** để đăng ký người dùng, cấp phát JWT và bảo vệ các route bảo mật.
- **Dịch vụ sản phẩm** duy trì dữ liệu sản phẩm và gửi tin nhắn liên quan đến sản phẩm qua RabbitMQ.
- **Dịch vụ đơn hàng** tiêu thụ các sự kiện sản phẩm, lưu trữ đơn hàng và điều phối với hàng đợi RabbitMQ.
- **API Gateway** chuyển tiếp lưu lượng truy cập bên ngoài đến các dịch vụ riêng lẻ và tập trung việc định tuyến.
- **Công cụ chia sẻ** để kiểm thử với Mocha/Chai và tự động hóa end-to-end thông qua GitHub Actions.

## Kiến Trúc

| Thành Phần    | Mô Tả                                                                                    | Cổng Mặc Định                          |
| ------------- | ---------------------------------------------------------------------------------------- | -------------------------------------- |
| `auth`        | Xử lý đăng ký người dùng, đăng nhập và xác thực token với MongoDB.                      | `3000`                                 |
| `product`     | Quản lý danh mục sản phẩm và gửi sự kiện qua RabbitMQ.                                  | `3001`                                 |
| `order`       | Chấp nhận đơn hàng của khách hàng và phản ứng với các sự kiện sản phẩm qua RabbitMQ.    | `3002`                                 |
| `api-gateway` | Express + http-proxy làm điểm vào định tuyến lưu lượng `/auth`, `/products`, `/orders`.  | `3003`                                 |
| `mongo`       | Phiên bản MongoDB lưu trữ dữ liệu cho các dịch vụ.                                      | `27017`                                |
| `rabbitmq`    | Message broker được sử dụng để giao tiếp bất đồng bộ giữa các dịch vụ.                  | `5672` (AMQP) / `15672` (giao diện quản lý) |

Các dịch vụ giao tiếp qua REST over HTTP và publish/consume các sự kiện trên hàng đợi RabbitMQ chia sẻ (`orders`, `products`). Cấu hình mặc định được cung cấp trong mỗi dịch vụ nhưng có thể được ghi đè bằng các biến môi trường.

```
.
├── api-gateway        # Lớp proxy ngược và định tuyến
├── auth               # Dịch vụ xác thực (MongoDB + JWT)
├── order              # Dịch vụ xử lý đơn hàng (MongoDB + RabbitMQ consumer)
├── product            # Dịch vụ danh mục sản phẩm (MongoDB + RabbitMQ publisher)
├── utils              # Thư viện tiện ích chia sẻ giữa các dịch vụ
├── docker-compose.yml # Khởi động tất cả dịch vụ cộng với MongoDB & RabbitMQ
└── .github/workflows  # Định nghĩa pipeline tích hợp liên tục
```

### Cấu Hình Môi Trường

Mỗi dịch vụ đọc cấu hình từ các biến môi trường với giá trị mặc định hợp lý:

- `auth`: `PORT`, `MONGODB_AUTH_URI`, `JWT_SECRET`.
- `product`: `PORT`, `MONGODB_PRODUCT_URI`, `RABBITMQ_URI`, `RABBITMQ_ORDER_QUEUE`, `RABBITMQ_PRODUCT_QUEUE`, `JWT_SECRET`, `RABBITMQ_CONNECT_DELAY_MS`.
- `order`: `PORT`, `MONGODB_ORDER_URI`, `RABBITMQ_URI`, `RABBITMQ_ORDER_QUEUE`, `RABBITMQ_PRODUCT_QUEUE`, `JWT_SECRET`, `RABBITMQ_CONNECT_DELAY_MS`.
- `api-gateway`: `PORT`, `AUTH_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL` hoặc các override `_HOST`/`_PORT` tương ứng.

Sao chép các biến cần thiết vào file `.env` dưới mỗi dịch vụ (ví dụ: `auth/.env`, `product/.env`, v.v.) trước khi chạy stack.

> **Thông tin xác thực RabbitMQ:** Docker Compose hiện cung cấp RabbitMQ với user `app` / `app`. Các dịch vụ mặc định sử dụng `amqp://app:app@rabbitmq:5672`, vì vậy hãy cập nhật các file `.env` tùy chỉnh để khớp.

### Chạy với Docker Compose

1. Đảm bảo Docker đang chạy.
2. Build và khởi động toàn bộ stack:

   ```bash
   docker compose up --build
   ```

3. Truy cập các dịch vụ thông qua API gateway tại `http://localhost:3003`. Gateway proxy các yêu cầu đến `/auth`, `/products`, và `/orders`.

4. Dừng stack khi hoàn thành:

   ```bash
   docker compose down
   ```

### Chạy dịch vụ cục bộ (không có Docker)

Mỗi dịch vụ cũng có thể được khởi động từ máy host:

```bash
# Từ thư mục gốc repository
npm install

# Cài đặt dependencies bên trong các dịch vụ riêng lẻ nếu cần
npm install --prefix auth
npm install --prefix product
npm install --prefix order
npm install --prefix api-gateway

# Khởi động một dịch vụ
npm start --prefix auth
```

Đảm bảo MongoDB và RabbitMQ có sẵn cục bộ (mặc định giả định `localhost`).

## Kiểm Thử

Chạy bộ test cấp dịch vụ với Mocha/Chai từ thư mục gốc repository:

```bash
npm test
```

Bạn cũng có thể nhắm mục tiêu một dịch vụ cụ thể:

```bash
npm test --prefix auth
npm test --prefix product
npm test --prefix order
```

## Tích Hợp Liên Tục

GitHub Actions chạy workflow được định nghĩa trong [`.github/workflows/ci.yml`](.github/workflows/ci.yml) trên mỗi push và pull request. Pipeline:

1. Checkout repository và thiết lập Node.js 18 với npm caching.
2. Cài đặt dependencies và thực hiện bộ test chia sẻ (`npm ci && npm test`).
3. Build Docker images cho mọi dịch vụ để bắt lỗi Dockerfile regression.
4. Trên push đến `main` hoặc `master`, đăng nhập vào Docker Hub (sử dụng repository secrets) và đẩy tagged images cho mỗi dịch vụ.

Bạn có thể kích hoạt pipeline thủ công hoặc theo dõi trạng thái từ tab **Actions** trong GitHub. Status badge ở đầu README này phản ánh workflow run gần nhất.

## Khắc Phục Sự Cố

- Các dịch vụ RabbitMQ có thể cần vài giây để chấp nhận kết nối. Điều chỉnh `RABBITMQ_CONNECT_DELAY_MS` trong file `.env` của dịch vụ nếu bạn gặp lỗi kết nối trong quá trình khởi động.
- Nếu Docker builds không thể xác thực với Docker Hub, kiểm tra kỹ rằng các secrets `DOCKER_NAME` và `DOCKER_TOKEN` được cấu hình trong cài đặt GitHub repository.
- Xóa thư mục `node_modules` trước khi rebuild containers nếu bạn gặp phải native dependencies không khớp.

## Đóng Góp

Issues và pull requests được hoan nghênh! Vui lòng mở một ticket mô tả thay đổi, đảm bảo tests pass cục bộ, và liên kết đến bất kỳ GitHub Actions runs liên quan nào.