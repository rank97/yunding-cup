# 🤝 参与贡献 (Contributing Guide)

感谢你对 **TFT TourneyOS** 云顶之弈赛事系统的关注！我们非常欢迎社区提交 Issue、提出需求或贡献代码。

---

## 🛠️ 本地开发环境准备

- **JDK**: Java 17+
- **Node.js**: Node.js 18+ (推荐 Node 20)
- **Maven**: 3.8+

### 1. 启动后端
```bash
cd server
mvn spring-boot:run
```

### 2. 启动前端
```bash
cd client
npm install
npm run dev
```

---

## 📋 提交流程 (Git Workflow)

1. Fork 本仓库并基于 `main` 分支拉取你的功能分支 (`git checkout -b feature/awesome-feature`)
2. 编写代码并确保本地构建测试通过 (`npm run build` 和 `mvn clean compile`)
3. 提交你的修改并附带清晰的 Commit Message (`git commit -m 'feat: add amazing feature'`)
4. 推送分支并向 `main` 分支发起 Pull Request (PR)

---

## 📜 行为准则
请保持友好、包容与尊重，共同维护良好的开源社区生态。
