<div align="center">
    <a href="https://github.com/MarSeventh/CloudFlare-ImgBed"><img width="80%" alt="logo" src="static/readme/banner.png"/></a>
    <p><em>🗂️开源文件托管解决方案，支持 Docker 和无服务器部署，支持 Telegram Bot 、 Cloudflare R2 、S3 等多种存储渠道</em></p>
    <p>
        <a href="https://github.com/MarSeventh/CloudFlare-ImgBed/blob/main/README.md">简体中文</a> | <a href="https://github.com/MarSeventh/CloudFlare-ImgBed/blob/main/README_en.md">English</a> | <a href="https://cfbed.sanyue.de">官方网站</a>
    </p>
    <div>
        <a href="https://github.com/MarSeventh/CloudFlare-ImgBed/blob/main/LICENSE">
        <img src="https://img.shields.io/github/license/MarSeventh/CloudFlare-ImgBed" alt="License" />
        </a>
        <a href="https://github.com/MarSeventh/CloudFlare-ImgBed/releases">
        <img src="https://img.shields.io/github/release/MarSeventh/CloudFlare-ImgBed" alt="latest version" />
        </a>
        <a href="https://github.com/MarSeventh/CloudFlare-ImgBed/releases">
        <img src="https://img.shields.io/github/downloads/MarSeventh/CloudFlare-ImgBed/total?color=%239F7AEA&logo=github" alt="Downloads" />
        </a>
        <a href="https://hub.docker.com/r/marseventh/cloudflare-imgbed">
  		  <img src="https://img.shields.io/docker/pulls/marseventh/cloudflare-imgbed?style=flat-square" alt="Docker Pulls" />
		</a>
        <a href="https://github.com/MarSeventh/CloudFlare-ImgBed/issues">
          <img src="https://img.shields.io/github/issues/MarSeventh/CloudFlare-ImgBed" alt="Issues" />
        </a>
        <a href="https://github.com/MarSeventh/CloudFlare-ImgBed/stargazers">
          <img src="https://img.shields.io/github/stars/MarSeventh/CloudFlare-ImgBed" alt="Stars" />
        </a>
        <a href="https://github.com/MarSeventh/CloudFlare-ImgBed/network/members">
          <img src="https://img.shields.io/github/forks/MarSeventh/CloudFlare-ImgBed" alt="Forks" />
        </a>
    </div>
</div>





---

> [!IMPORTANT]
>
> **v2.0 版本升级注意事项请查看公告！**



<details>
    <summary>公告</summary>



## 置顶

1. 部署使用出现问题，请先仔细查阅文档、常见问题解答以及已有issues。

2. **注意**：本仓库为[Telegraph-Image](https://github.com/cf-pages/Telegraph-Image)项目的重制版，如果你觉得本项目不错，在支持本项目的同时，也请支持原项目。

## 2025.2.6  V2.0 版本升级注意事项

> v2.0 版已发布，相较于 v1.0 版本进行了大量改动和优化，但 beta 版本可能存在潜在不稳定性，若您追求稳定，可选择暂缓更新。
>
> 由于**构建命令发生了变化**，此次更新需要您**手动进行**，请按照以下步骤进行操作：
>
> - 同步fork的仓库至最新版（若已自动同步可忽略）
>
> - 前往 pages 管理页面，进入`设置`->`构建`，编辑`构建配置`，在`构建命令`处填写`npm install`
>
> - 新版本所有设置项已**迁移至 管理端->系统设置 界面**，原则上无需再通过环境变量的方式进行设置，通过系统设置界面进行的设置将**覆盖掉**环境变量中的设置，但为了保证 **Telegram渠道的图片** 能够与旧版本相兼容，**若您之前设置了 Telegram 渠道相关的环境变量，请将其保留！**
>
> - 确保上述设置完成无误后，前往 pages 管理页面，进入`部署`，对最后一次不成功的部署进行`重试操作`

## 关于切换到 Telegram 渠道的通知


> 由于telegraph图床被滥用，该项目上传渠道已切换至Telegram Channel，请**更新至最新版（更新方式见第3.1章最后一节）**，按照文档中的部署要求**设置`TG_BOT_TOKEN`和`TG_CHAT_ID`**，否则将无法正常使用上传功能。
>
> 此外，目前**KV数据库为必须配置**，如果以前未配置请按照文档说明配置。
>
> 出现问题，请先查看第5节常见问题Q&A部分。

</details>




# 1. Introduction

免费文件托管解决方案，具有**上传**、**管理**、**读取**、**删除**等全链路功能，覆盖文件全生命周期，支持**鉴权**、**目录**、**图片审查**、**随机图**等各项特性（详见[功能文档](https://cfbed.sanyue.de/guide/features.html)）。

![CloudFlare](static/readme/海报.png)

# 2. [Document](https://cfbed.sanyue.de)

提供详细的部署文档、功能文档、开发计划、更新日志、常见问题解答等，帮助您快速上手。

[![更新日志](https://recent-update.cfbed.sanyue.de/cn)](https://cfbed.sanyue.de/guide/update-log.html)

# 3. Demo

**演示站点**：[CloudFlare ImgBed](https://cfbed.1314883.xyz/) 访问密码：`cfbed`

![image-20250313204101984](static/readme/202503132041511.png)

![image-20250313204138886](static/readme/202503132041072.png)

<details>
    <summary>其他页面效果展示</summary>

![image-20250313204308225](static/readme/202503132043466.png)

![image-20250314152355339](static/readme/202503141524797.png)

![status-page](static/readme/status-page.png)

![image-20250313204325002](static/readme/202503132043265.png)



</details>


# 4. 部署指南 (Deployment Guide)

本指南将引导您完成在 Cloudflare Pages 上的全流程部署，并配置 Telegram 作为主要存储。

## 步骤一：前置准备

在开始部署之前，请确保您已准备好以下账号和信息：

1.  **GitHub 账户**：用于 Fork 本项目仓库。
2.  **Cloudflare 账户**：用于部署应用和使用其服务。
3.  **Telegram Bot (机器人)**：
    *   在 Telegram 中搜索 `BotFather`。
    *   发送 `/newbot` 指令创建一个新的机器人。
    *   按照提示为您的机器人命名，您将获得一个 **Bot Token** (格式类似于 `123456:ABC-DEF1234ghIkl-zyx57W2v1u123456789`)，请**妥善保管**。
4.  **Telegram Channel (频道)**：
    *   创建一个**公开 (Public)** 频道，用于存放上传的文件。
    *   将您刚刚创建的机器人添加为该频道的**管理员**。
    *   获取频道的 **Chat ID**。对于公开频道，它就是 `@` 符号后面的频道用户名 (例如 `@my_channel_name`)。

## 步骤二：一键部署到 Cloudflare Pages

准备工作就绪后，您可以开始一键部署。

[![Deploy with Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/?to=/:account/pages/new?repoUrl=https://github.com/MarSeventh/CloudFlare-ImgBed)

点击上方按钮，浏览器将跳转到 Cloudflare 仪表盘，并开始部署流程。

## 步骤三：在 Cloudflare 中完成配置

1.  **登录并授权**：
    *   如果您尚未登录 Cloudflare，请先登录。
    *   授权 Cloudflare 访问您的 GitHub 账户。

2.  **选择仓库**：
    *   在 "Create a new Pages site" 页面，系统会自动填入本项目的仓库地址。
    *   您需要点击 "Fork" 按钮，将该仓库 Fork 到您自己的 GitHub 账户下。
    *   Fork 成功后，确保已选中您账户下的 `CloudFlare-ImgBed` 仓库，然后点击 "Begin setup"。

3.  **配置构建设置**：
    *   **Project name**：为您的项目取一个名字，这将成为您网站的二级域名。
    *   **Production branch**：保持 `main` 不变。
    *   在 "Build settings" 部分：
        *   **Framework preset**：选择 `None`。
        *   **Build command**：填写 `npm install`。
        *   **Build output directory**：留空或填写 `./`。

4.  **设置环境变量和绑定 (最关键步骤)**：
    *   展开 "Environment variables (advanced)" 部分。
    *   点击 "Add variable" 添加以下两个**环境变量**，用于连接 Telegram：
        *   `TG_BOT_TOKEN`：粘贴您在步骤一中获取的 Bot Token。
        *   `TG_CHAT_ID`：填写您在步骤一中获取的频道 Chat ID (例如 `@my_channel_name`)。
    *   接下来，配置**服务绑定 (Bindings)**，这是系统运行所必需的。
    *   **KV Namespace Bindings**:
        *   点击 "Add binding"。
        *   **Variable name**: `img_url`
        *   **KV namespace**: 点击下拉菜单，选择 "Create a new namespace"，输入一个名称（例如 `img_url_kv`）并创建。
    *   **R2 Bucket Bindings**:
        *   点击 "Add binding"。
        *   **Variable name**: `img_r2`
        *   **R2 bucket**: 点击下拉菜单，选择 "Create a new bucket"，输入一个名称（例如 `img-r2-bucket`）并创建。
        *   *注意：即使主要使用 Telegram，绑定 KV 和 R2 也是推荐的最佳实践，以确保所有功能正常并为未来提供灵活性。*

5.  **开始部署**：
    *   检查所有配置无误后，点击页面底部的 **"Save and Deploy"** 按钮。
    *   Cloudflare 将开始拉取代码、构建并部署您的应用。您可以实时查看部署日志。

## 步骤四：部署后初始化

*   部署成功后，Cloudflare 会提供给您一个访问域名 (例如 `your-project-name.pages.dev`)。
*   首次访问该域名，系统会引导您进入管理后台进行初始化设置，例如设置管理员密码等。
*   完成初始化后，您就可以开始上传和管理您的文件了！

---

# 5. Tips

- **前端开源**：参见[MarSeventh/Sanyue-ImgHub](https://github.com/MarSeventh/Sanyue-ImgHub)项目。

- **生态建设**：欢迎社区参与生态建设，欢迎提交 PR 或者 Issue，优质内容参见[官网生态建设页面](https://cfbed.sanyue.de/about/ecosystem.html)。

- **赞助**：项目维护不易，喜欢本项目的话，可以作者大大一点小小的鼓励哦，您的每一份支持都是我前进的动力\~ 

  <a href="https://afdian.com/a/marseventh"><img width="200" src="https://pic1.afdiancdn.com/static/img/welcome/button-sponsorme.png" alt=""></a>
  
- **Sponsors**：感谢以下赞助者对本项目的支持！

  [![赞助者](https://afdian-sponsors.sanyue.de/image)](https://afdian.com/a/marseventh)
  
- **Contributors**：感谢以下贡献者对本项目的无私贡献！

  [![Contributors](https://contrib.rocks/image?repo=Marseventh/Cloudflare-ImgBed)](https://github.com/MarSeventh/CloudFlare-ImgBed/graphs/contributors)

# 5. Star History

**如果觉得项目不错希望您能给个免费的star✨✨✨，非常感谢！**

[![Star History Chart](https://api.star-history.com/svg?repos=MarSeventh/CloudFlare-ImgBed,MarSeventh/Sanyue-ImgHub&type=Date)](https://star-history.com/#MarSeventh/CloudFlare-ImgBed&MarSeventh/Sanyue-ImgHub&Date)

# 6. Special Sponsors

- **[CloudFlare](https://www.cloudflare.com) & [EdgeOne](https://edgeone.ai/?from=github)**：提供CDN加速和安全保护服务

  <a href="https://www.cloudflare.com"><img src="static/readme/cloudflare-logo.png" alt="Cloudflare Logo" height="25"></a> <a href="https://edgeone.ai/?from=github"><img src="https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png" alt="Tencent Logo" height="25"></a>

- **[亚洲云](https://www.asiayun.com) & [DartNode](https://dartnode.com)**：提供云计算服务资源支持

  [![Powered by DartNode](https://dartnode.com/branding/DN-Open-Source-sm.png)](https://dartnode.com "Powered by DartNode - Free VPS for Open Source")

