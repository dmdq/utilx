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

- 🎯 **200+ Utilities** - Covering development, encryption, text processing, image processing, health, finance, and more
- 🌙 **Dark/Light Theme** - Theme switching support to protect your eyes
- 📱 **Responsive Design** - Perfect adaptation for desktop and mobile devices
- ⚡ **Pure Frontend** - All calculations run locally in your browser, protecting data privacy
- 🚫 **Ad-Free** - Clean user experience focused on the tools themselves
- 🎨 **Modern UI** - Beautiful interface based on Tailwind CSS
- 📁 **File Processing** - Support drag-and-drop file upload and processing
- 💾 **Local Storage** - Favorites and recent usage history automatically saved

## 🛠️ Tool Categories

### 🎲 Random & Decision
- Random dice, coin, cards
- Random picker, draw tool
- Random number/password generator
- Random grouping, sorting

### 🔢 Calculators
- Scientific calculator
- BMI/BMR/Body fat calculator
- Finance calculators (investment, loan, ROI)
- Unit converter, currency converter
- Geometry calculator, matrix calculator

### 📊 Data Formatting
- JSON format/minify/convert to YAML/XML/CSV
- SQL formatting
- XML formatting
- YAML formatting
- Markdown editor
- Protocol Buffers conversion

### 🔐 Encoding/Decoding
- Base64 encode/decode/image to Base64
- URL encode/decode
- HTML encode/decode
- Unicode conversion
- Binary/Hexadecimal conversion
- Encoding converter

### 🔒 Encryption & Security
- MD5/SHA hash generation
- AES encrypt/decrypt
- RSA encrypt/decrypt/key generation
- JWT parse/verify
- BCrypt password generation/verification
- UUID generator
- HMAC generator
- Password strength checker

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
- Text difference comparison

### 🌐 Network Tools
- HTTP client
- IP address lookup
- DNS lookup
- User agent parser
- Port checker
- SSL certificate checker
- WebSocket tester
- API response simulator

### 🖼️ Image Processing
- Image compress/convert/crop/merge
- Watermark addition
- EXIF viewer
- ICO icon generator
- QR code generator/scanner
- SVG editor

### 🎨 Design Tools
- CSS layout generator
- Gradient generator
- Color picker
- Border generator
- Shadow generator
- Bezier curve editor
- Pattern generator

### 👨‍💻 Development Tools
- API documentation generator
- Mock data generator
- SQL model generator
- XML model generator
- Code formatter
- Git/Linux/Docker command generator
- Web component analyzer
- Algorithm complexity calculator

### 🛡️ Security Tools
- Data masking tool
- XSS detector
- SQL injection scanner
- Privacy protection tools
- Security vulnerability scanner
- Token generator

### 💰 Finance Tools
- Loan calculator
- Investment return calculator
- Pension calculator
- Retirement planning
- Tax calculator
- Currency converter
- Business analytics

### ❤️ Health Tools
- BMI calculator
- BMR calculator
- Body fat calculator
- Blood pressure tracker
- Heart rate calculator
- Sleep quality calculator
- Nutrition calculator
- Ideal weight calculator

### 🔧 Other Tools
- Data sampler
- Clipboard manager
- Data structure visualization
- Fund calculator
- Probability calculator
- Statistics calculator
- Algebra equation solver

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
util/
├── src/                    # Source code
│   ├── assets/            # Static assets
│   ├── components/        # Vue components
│   │   ├── Breadcrumb.vue # Breadcrumb navigation
│   │   ├── Footer.vue     # Footer component
│   │   ├── Sidebar.vue    # Sidebar component
│   │   ├── Settings.vue   # Settings component
│   │   ├── ToolSearch.vue # Tool search component
│   │   └── ...
│   ├── composables/       # Vue composables
│   │   ├── useClipboard.js # Clipboard functionality
│   │   ├── useFavorites.js # Favorites functionality
│   │   └── useToolPersistence.js # Tool persistence
│   ├── data/             # Data files
│   │   ├── categories.js  # Tool categories (15 categories)
│   │   ├── tools.js       # Tool definitions (200+ tools)
│   │   ├── site.js        # Site configuration
│   │   └── tags.js        # Tag management
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   │   ├── tools/        # Tool pages (200+ tool pages)
│   │   ├── category/     # Category pages
│   │   └── tag/          # Tag pages
│   ├── plugins/          # Plugins
│   │   ├── analytics.client.js # Analytics
│   │   ├── performance.client.js # Performance monitoring
│   │   └── tagManager.client.js # Tag management
│   └── utils/            # Utility functions
├── public/               # Public assets
│   ├── js/              # External link interceptor scripts
│   └── spine-player/    # Spine animation player
├── blog/                # Hugo blog system
│   ├── content/         # Blog articles
│   ├── static/          # Static files
│   ├── themes/          # Theme templates
│   └── hugo.toml       # Hugo configuration
├── scripts/             # Build and test scripts
├── app.vue             # Root component
├── nuxt.config.ts      # Nuxt configuration
└── package.json        # Project dependencies
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