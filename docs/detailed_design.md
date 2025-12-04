# BabyDaily 详细设计文档

## 1. 技术栈选型

为了保证开发效率、性能以及未来的可维护性，建议采用以下技术栈：

### 1.1 后端 (Backend)
- **框架**: **NestJS** (Node.js)
    - *理由*: 结构严谨，支持 TypeScript，适合企业级应用，易于维护和扩展。
- **语言**: **TypeScript**
- **数据库**: **PostgreSQL**
    - *理由*: 强大的关系型数据库，支持 JSONB，适合存储复杂的记录数据。
- **ORM**: **TypeORM** 或 **Prisma** (建议 TypeORM)
- **缓存**: **Redis** (用于 Session、缓存热点数据)
- **对象存储**: **MinIO** (自建) 或 阿里云 OSS / 腾讯云 COS (用于存储照片、视频)

### 1.2 前端 (Web - 管理后台)
- **框架**: **React** (使用 **Vite** 构建)
- **UI 组件库**: **Ant Design** 或 **Mantine**
- **状态管理**: **Zustand** 或 **Redux Toolkit**
- **数据获取**: **TanStack Query (React Query)**

### 1.3 微信小程序 (Mini Program)
- **框架**: **Uni-app** (Vue 3 版本)
    - *理由*: 一套代码可发布到微信小程序、H5、App，开发体验接近 Vue，生态丰富。
- **UI 组件库**: **Uni-ui** 或 **ThorUI**

## 2. 数据库设计 (Database Schema)

### 2.1 用户与家庭 (Users & Family)

**User (用户表)**
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| openid | String | 微信 OpenID (唯一) |
| nickname | String | 昵称 |
| avatar_url | String | 头像地址 |
| created_at | DateTime | 创建时间 |

**Family (家庭组表)**
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| name | String | 家庭名称 (e.g., "宝宝的家") |
| creator_id | UUID | 创建者 ID (关联 User) |

**FamilyMember (家庭成员关联表)**
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| family_id | UUID | 家庭 ID |
| user_id | UUID | 用户 ID |
| role | Enum | 角色 (ADMIN, MEMBER, VIEWER) |
| relation | String | 关系 (e.g., "爸爸", "奶奶") |

### 2.2 宝宝信息 (Baby)

**Baby (宝宝表)**
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| family_id | UUID | 所属家庭 ID |
| name | String | 姓名/小名 |
| gender | Enum | 性别 (MALE, FEMALE) |
| birthday | Date | 出生日期 |
| blood_type | String | 血型 (可选) |

### 2.3 日常记录 (Records)

**Record (记录主表)**
*设计思路：使用单表继承或通用表结构来存储不同类型的记录，方便按时间轴查询。*

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| baby_id | UUID | 关联宝宝 ID |
| creator_id | UUID | 记录人 ID |
| type | Enum | 类型 (FEED, SLEEP, DIAPER, BATH, HEALTH, GROWTH, MILESTONE) |
| time | DateTime | 发生时间 |
| end_time | DateTime | 结束时间 (用于睡眠、哺乳等持续性活动) |
| details | JSONB | 详细数据 (根据类型存储不同结构) |
| media_urls | String[] | 图片/视频 URL 列表 |
| remark | String | 备注 |

**Details JSON 结构示例**:
- **FEED (喂养)**: `{ "subtype": "BREAST/BOTTLE/SOLID", "amount": 150, "unit": "ml", "food": "Rice Cereal" }`
- **DIAPER (尿布)**: `{ "type": "PEE/POO/BOTH", "color": "YELLOW", "texture": "SOFT" }`
- **GROWTH (生长)**: `{ "height": 75.5, "weight": 9.2, "head_circumference": 44 }`

### 2.4 疫苗 (Vaccines)

**VaccinePlan (疫苗计划表)**
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| name | String | 疫苗名称 |
| month_age | Int | 接种月龄 |
| is_mandatory | Boolean | 是否必须 |

**VaccineRecord (疫苗接种记录)**
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| baby_id | UUID | 宝宝 ID |
| vaccine_plan_id | UUID | 关联计划 ID |
| vaccination_date | Date | 实际接种日期 |
| hospital | String | 接种医院 |

## 3. API 接口设计 (RESTful)

### 3.1 认证 (Auth)
- `POST /auth/login/wechat`: 微信登录，返回 JWT Token。
- `GET /auth/profile`: 获取当前用户信息。

### 3.2 家庭与宝宝 (Family & Baby)
- `POST /families`: 创建家庭。
- `GET /families/my`: 获取我的家庭列表。
- `POST /families/:id/members`: 邀请/添加成员。
- `POST /babies`: 添加宝宝。
- `GET /babies/:id`: 获取宝宝详情。

### 3.3 记录 (Records)
- `POST /records`: 新增记录。
- `GET /records`: 获取记录列表 (支持分页、筛选、时间范围)。
- `GET /records/timeline`: 获取时间轴数据。
- `GET /records/statistics`: 获取统计数据 (如今日奶量、睡眠时长)。
- `PUT /records/:id`: 修改记录。
- `DELETE /records/:id`: 删除记录。

### 3.4 媒体 (Media)
- `POST /upload/token`: 获取上传凭证 (用于直传 OSS，减轻服务器压力)。

## 4. 目录结构规划

建议采用 Monorepo 结构 (使用 Turborepo 或 Nx) 管理所有代码，或者简单的多文件夹结构。

```
/BabyDaily
  /backend       (NestJS 项目)
    /src
      /modules
        /auth
        /user
        /family
        /baby
        /record
      /common
      /entities
  /frontend      (React Web 项目)
  /miniprogram   (Uni-app 项目)
  /docs          (文档)
```

## 5. 开发计划 (Roadmap)

1.  **Phase 1: 基础架构搭建**
    - 初始化 Monorepo。
    - 搭建 NestJS 后端，配置数据库连接。
    - 实现微信登录接口。
2.  **Phase 2: 核心业务 - 记录功能**
    - 数据库建表。
    - 实现记录的 CRUD 接口。
    - 开发小程序端的记录界面和时间轴。
3.  **Phase 3: 数据展示与统计**
    - 开发 Web 端管理后台。
    - 实现生长曲线和统计图表。
4.  **Phase 4: 优化与发布**
    - 媒体文件上传功能。
    - 性能优化。
    - 部署上线。
