# Util.cn - Developer Toolbox

<div align="center">
  <img src="public/favicon.ico" alt="Util.cn Logo" width="80">

  [![Vue.js](https://img.shields.io/badge/Vue.js-3.5.25-green)](https://vuejs.org/)
  [![Nuxt.js](https://img.shields.io/badge/Nuxt.js-3.20.2-blue)](https://nuxt.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.0-38B2AC)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
  [![GitHub stars](https://img.shields.io/github/stars/dmdq/utilx?style=social)](https://github.com/dmdq/utilx/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/dmdq/utilx?style=social)](https://github.com/dmdq/utilx/network)
  [![GitHub issues](https://img.shields.io/github/issues/dmdq/utilx)](https://github.com/dmdq/utilx/issues)

  **🚀 A modern, ad-free developer toolbox with 80+ utilities**

  [简体中文文档](README.md) | **English Documentation**
</div>

---

<img src="public/snapshot.png" alt="Util.cn Snapshot" width="640">

## ✨ Features

- 🎯 **80+ Utilities** - Covering development, encryption, text processing, image processing, and more
- 🌙 **Dark/Light Theme** - Theme switching support to protect your eyes
- 📱 **Responsive Design** - Perfect adaptation for desktop and mobile devices
- ⚡ **Pure Frontend** - All calculations run locally in your browser, protecting data privacy
- 🚫 **Ad-Free** - Clean user experience focused on the tools themselves
- 🎨 **Modern UI** - Beautiful interface based on Tailwind CSS
- 📁 **File Processing** - Support drag-and-drop file upload and processing
- 💾 **Local Storage** - Favorites and recent usage history automatically saved

## 🛠️ Tool Categories

### 📊 Data Formatting
- JSON format/minify/convert to YAML/XML/CSV
- SQL formatting
- XML formatting
- YAML formatting
- Markdown editor

### 🔐 Encoding/Decoding
- Base64 encode/decode/image to Base64
- URL encode/decode
- HTML encode/decode
- Unicode conversion
- Binary/Hexadecimal conversion

### 🔒 Encryption & Security
- MD5/SHA hash generation
- AES encrypt/decrypt
- RSA encrypt/decrypt/key generation
- JWT parse/verify
- BCrypt password generation/verification
- UUID generator
- HMAC generator

### ⏰ Time & Date
- Unix timestamp conversion
- Timezone conversion
- Date calculator
- Cron expression generator/parser
- Countdown timer
- Stopwatch

### 📝 Text Processing
- Regex tester/generator/cheatsheet
- Text diff
- Case converter
- Text replace/counter
- Morse code
- Lorem Ipsum generator

### 🌐 Network Tools
- HTTP client
- IP address lookup
- DNS lookup
- User agent parser
- Port checker
- SSL certificate checker
- WebSocket tester

### 🖼️ Image Processing
- Image compress/convert/crop/merge
- Watermark addition
- EXIF viewer
- ICO icon generator

### 👨‍💻 Development Tools
- API documentation generator
- Mock data generator
- SQL model generator
- XML model generator
- Code formatter
- Git/Linux/Docker command generator

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm, yarn, or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/dmdq/utilx.git

# Navigate to the project directory
cd utilx

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development
```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev

# Visit http://localhost:3000
```

### Build
```bash
# Build for production
npm run build
# or
yarn build
# or
pnpm build

# Start production server
npm run start
# or
yarn start
# or
pnpm start
```

### Static Generation
```bash
# Generate static site
npm run generate
# or
yarn generate
# or
pnpm generate
```

## 📁 Project Structure

```
utilx/
├── src/                    # Source code
│   ├── assets/            # Static assets
│   ├── components/        # Vue components
│   │   ├── Breadcrumb.vue # Breadcrumb navigation
│   │   ├── Footer.vue     # Footer component
│   │   ├── Sidebar.vue    # Sidebar component
│   │   └── ...
│   ├── composables/       # Vue composables
│   ├── data/             # Data files
│   │   ├── categories.js  # Tool categories
│   │   └── tools.js       # Tool definitions
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   └── plugins/          # Plugins
├── public/               # Public assets
├── app.vue              # Root component
└── nuxt.config.ts       # Nuxt configuration
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Adding New Tools

We welcome contributions for new tools! Please follow these steps:

1. Add tool definition in `src/data/tools.js`
2. Create tool page in `src/pages/tools/` directory
3. Update `src/data/categories.js` if new category is needed
4. Submit a Pull Request

## 🌟 Acknowledgments

Thanks to these open source projects:
- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Nuxt.js](https://nuxt.com/) - The Intuitive Vue Framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit
- [CryptoJS](https://cryptojs.gitbook.io/) - JavaScript library of crypto standards

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 📧 Contact

- 📧 Email: skyin.lewis@gmail.com
- 🐛 Report issues: [GitHub Issues](https://github.com/dmdq/utilx/issues)
- 💬 Feature requests: [GitHub Discussions](https://github.com/dmdq/utilx/discussions)

---

<div align="center">
  Made with ❤️ by Util.cn Team

  [⭐ Star this repo](https://github.com/dmdq/utilx) if it helped you!
</div>