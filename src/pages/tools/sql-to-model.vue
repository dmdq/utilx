<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">SQL 转 Model 类</h1>
      <p class="text-muted-foreground">将 SQL 语句转换为各种编程语言的 Model 类，支持主流开发框架</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 目标语言选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">目标语言</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="lang in languages"
              :key="lang.value"
              @click="selectedLanguage = lang.value"
              :class="[
                'px-4 py-3 rounded-md transition-colors text-left',
                selectedLanguage === lang.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">{{ lang.name }}</div>
              <div class="text-xs opacity-80">{{ lang.description }}</div>
            </button>
          </div>
        </div>

        <!-- SQL 输入 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">SQL 语句</h2>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                加载示例
              </button>
              <button
                @click="clearSql"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="sqlInput"
            placeholder="输入 CREATE TABLE 语句..."
            class="w-full h-64 px-4 py-3 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>

          <!-- 配置选项 -->
          <div class="mt-4 space-y-3">
            <div class="flex items-center gap-3">
              <input
                v-model="options.useLombok"
                type="checkbox"
                id="useLombok"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="useLombok" class="text-sm">使用 Lombok 注解 (Java)</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.useDataAnnotations"
                type="checkbox"
                id="useDataAnnotations"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="useDataAnnotations" class="text-sm">使用数据注解</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.generateConstructors"
                type="checkbox"
                id="generateConstructors"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="generateConstructors" class="text-sm">生成构造函数</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.generateGettersSetters"
                type="checkbox"
                id="generateGettersSetters"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="generateGettersSetters" class="text-sm">生成 Getter/Setter</label>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：输出区域 -->
      <div class="space-y-4">
        <!-- 生成预览 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">生成结果</h2>
            <div class="flex gap-2">
              <button
                @click="copyModel"
                :disabled="!generatedModel"
                class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ copied ? '已复制' : '复制' }}
              </button>
              <button
                @click="downloadModel"
                :disabled="!generatedModel"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下载
              </button>
            </div>
          </div>

          <div class="border rounded-lg p-4 bg-muted/30 min-h-[500px] max-h-[600px] overflow-auto">
            <pre v-if="generatedModel" class="text-sm whitespace-pre-wrap font-mono"><code>{{ generatedModel }}</code></pre>
            <div v-else class="text-center text-muted-foreground py-12">
              <Code class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>请输入 SQL 语句后生成 Model 类</p>
            </div>
          </div>
        </div>

        <!-- 表结构预览 -->
        <div v-if="parsedTable" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">表结构</h2>
          <div class="overflow-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">字段名</th>
                  <th class="text-left py-2">类型</th>
                  <th class="text-left py-2">约束</th>
                  <th class="text-left py-2">默认值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="column in parsedTable.columns" :key="column.name" class="border-b">
                  <td class="py-2 font-mono">{{ column.name }}</td>
                  <td class="py-2">{{ column.type }}</td>
                  <td class="py-2">
                    <span v-if="column.nullable" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">NULL</span>
                    <span v-if="column.primaryKey" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">PK</span>
                    <span v-if="column.autoIncrement" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">AUTO</span>
                  </td>
                  <td class="py-2 font-mono text-xs">{{ column.defaultValue || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          支持的 SQL 格式
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">标准 CREATE TABLE 语句</h4>
            <code class="block bg-muted p-3 rounded-md font-mono text-sm">
CREATE TABLE users (<br>
&nbsp;&nbsp;id INT PRIMARY KEY AUTO_INCREMENT,<br>
&nbsp;&nbsp;username VARCHAR(50) NOT NULL UNIQUE,<br>
&nbsp;&nbsp;email VARCHAR(100) NOT NULL,<br>
&nbsp;&nbsp;created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP<br>
);
            </code>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">支持的数据类型映射</h4>
            <ul class="list-disc list-inside space-y-1">
              <li>INT, INTEGER → int/Integer</li>
              <li>BIGINT → long/Long</li>
              <li>VARCHAR, CHAR, TEXT → String</li>
              <li>DECIMAL, DOUBLE, FLOAT → double/Double</li>
              <li>BOOLEAN, TINYINT(1) → boolean/Boolean</li>
              <li>DATE, DATETIME, TIMESTAMP → Date/LocalDateTime</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/json-to-model"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON 转 Model</p>
              <p class="text-xs text-muted-foreground">JSON 数据转模型类</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/xml-to-model"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileJson class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">XML 转 Model</p>
              <p class="text-xs text-muted-foreground">XML 数据转模型类</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/sql-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Database class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">SQL 格式化</p>
              <p class="text-xs text-muted-foreground">格式化 SQL 语句</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Info, Code, FileText, FileJson, Database, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const selectedLanguage = ref('java')
const sqlInput = ref('')
const copied = ref(false)
const parsedTable = ref(null)

// 配置选项
const options = ref({
  useLombok: true,
  useDataAnnotations: true,
  generateConstructors: false,
  generateGettersSetters: false
})

// 支持的语言
const languages = [
  { value: 'java', name: 'Java', description: '支持 JPA/Hibernate 注解' },
  { value: 'python', name: 'Python', description: '支持 SQLAlchemy/Django 模型' },
  { value: 'csharp', name: 'C#', description: '支持 Entity Framework' },
  { value: 'typescript', name: 'TypeScript', description: '支持 TypeORM/Prisma' },
  { value: 'php', name: 'PHP', description: '支持 Laravel/Eloquent' },
  { value: 'go', name: 'Go', description: '支持 GORM 标签' }
]

// 示例 SQL
const exampleSql = `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  age INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`

// 生成 Model 类
const generatedModel = computed(() => {
  if (!parsedTable.value) return ''

  switch (selectedLanguage.value) {
    case 'java':
      return generateJavaModel()
    case 'python':
      return generatePythonModel()
    case 'csharp':
      return generateCSharpModel()
    case 'typescript':
      return generateTypeScriptModel()
    case 'php':
      return generatePHPModel()
    case 'go':
      return generateGoModel()
    default:
      return ''
  }
})

// 解析 SQL
const parseSQL = (sql) => {
  if (!sql) return null

  const createTableMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(([\s\S]*)\)/i)
  if (!createTableMatch) return null

  const tableName = createTableMatch[1]
  const columnsText = createTableMatch[2]

  const columns = []
  const lines = columnsText.split(',').map(line => line.trim())

  for (const line of lines) {
    if (!line || line.toLowerCase().includes('primary key') || line.toLowerCase().includes('unique key') || line.toLowerCase().includes('foreign key') || line.toLowerCase().includes('index')) {
      continue
    }

    const columnMatch = line.match(/^`?(\w+)`?\s+(\w+(?:\(\d+(?:,\d+)?\))?)(?:\s+(.*))?$/)
    if (columnMatch) {
      const [, name, type, constraints] = columnMatch
      const column = {
        name,
        type: type.toUpperCase(),
        nullable: !constraints || !constraints.toLowerCase().includes('not null'),
        primaryKey: constraints && constraints.toLowerCase().includes('primary key'),
        autoIncrement: constraints && (constraints.toLowerCase().includes('auto_increment') || constraints.toLowerCase().includes('autoincrement')),
        unique: constraints && constraints.toLowerCase().includes('unique'),
        defaultValue: null
      }

      const defaultMatch = constraints?.match(/default\s+(['"]?)([^'"]+)\1/i)
      if (defaultMatch) {
        column.defaultValue = defaultMatch[2]
      }

      columns.push(column)
    }
  }

  return {
    tableName,
    className: toPascalCase(tableName),
    columns
  }
}

// 转换为 PascalCase
const toPascalCase = (str) => {
  return str.split(/[_-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
}

// 转换为 camelCase
const toCamelCase = (str) => {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// 映射数据类型
const mapDataType = (sqlType, language) => {
  const type = sqlType.toLowerCase()

  switch (language) {
    case 'java':
      if (type.includes('int')) return type.includes('bigint') ? 'Long' : 'Integer'
      if (type.includes('varchar') || type.includes('char') || type.includes('text')) return 'String'
      if (type.includes('decimal') || type.includes('double')) return 'BigDecimal'
      if (type.includes('float')) return 'Double'
      if (type.includes('boolean') || type.includes('tinyint(1)')) return 'Boolean'
      if (type.includes('date') || type.includes('timestamp')) return 'LocalDateTime'
      return 'Object'

    case 'python':
      if (type.includes('int')) return 'int'
      if (type.includes('varchar') || type.includes('char') || type.includes('text')) return 'str'
      if (type.includes('decimal') || type.includes('double') || type.includes('float')) return 'float'
      if (type.includes('boolean') || type.includes('tinyint(1)')) return 'bool'
      if (type.includes('date') || type.includes('timestamp')) return 'datetime'
      return 'str'

    case 'csharp':
      if (type.includes('bigint')) return 'long'
      if (type.includes('int')) return 'int'
      if (type.includes('varchar') || type.includes('char') || type.includes('text')) return 'string'
      if (type.includes('decimal')) return 'decimal'
      if (type.includes('double')) return 'double'
      if (type.includes('float')) return 'float'
      if (type.includes('boolean') || type.includes('tinyint(1)')) return 'bool'
      if (type.includes('date') || type.includes('timestamp')) return 'DateTime'
      return 'object'

    case 'typescript':
      if (type.includes('int') || type.includes('bigint') || type.includes('decimal') || type.includes('double') || type.includes('float')) return 'number'
      if (type.includes('varchar') || type.includes('char') || type.includes('text')) return 'string'
      if (type.includes('boolean') || type.includes('tinyint(1)')) return 'boolean'
      if (type.includes('date') || type.includes('timestamp')) return 'Date'
      return 'any'

    case 'php':
      if (type.includes('int') || type.includes('bigint')) return 'int'
      if (type.includes('varchar') || type.includes('char') || type.includes('text')) return 'string'
      if (type.includes('decimal') || type.includes('double') || type.includes('float')) return 'float'
      if (type.includes('boolean') || type.includes('tinyint(1)')) return 'bool'
      if (type.includes('date') || type.includes('timestamp')) return 'string'
      return 'mixed'

    case 'go':
      if (type.includes('bigint')) return 'int64'
      if (type.includes('int')) return 'int'
      if (type.includes('varchar') || type.includes('char') || type.includes('text')) return 'string'
      if (type.includes('decimal') || type.includes('double')) return 'float64'
      if (type.includes('float')) return 'float32'
      if (type.includes('boolean') || type.includes('tinyint(1)')) return 'bool'
      if (type.includes('date') || type.includes('timestamp')) return 'time.Time'
      return 'interface{}'

    default:
      return 'any'
  }
}

// 生成 Java Model
const generateJavaModel = () => {
  if (!parsedTable.value) return ''

  let imports = new Set()
  if (options.value.useLombok) {
    imports.add('lombok.Data')
    imports.add('lombok.NoArgsConstructor')
    imports.add('lombok.AllArgsConstructor')
  }
  if (options.value.useDataAnnotations) {
    imports.add('javax.persistence.*')
  }

  let result = ''
  if (imports.size > 0) {
    result += Array.from(imports).map(imp => `import ${imp};`).join('\n') + '\n\n'
  }

  const annotations = []
  if (options.value.useDataAnnotations) {
    annotations.push(`@Entity`)
    annotations.push(`@Table(name = "${parsedTable.value.tableName}")`)
  }

  if (annotations.length > 0) {
    result += annotations.join('\n') + '\n'
  }

  result += '\n'

  if (options.value.useLombok) {
    result += '@Data\n'
    if (options.value.generateConstructors) {
      result += '@NoArgsConstructor\n'
      result += '@AllArgsConstructor\n'
    }
  }

  result += `public class ${parsedTable.value.className} {\n`

  for (const column of parsedTable.value.columns) {
    const javaType = mapDataType(column.type, 'java')
    const fieldName = toCamelCase(column.name)

    if (options.value.useDataAnnotations) {
      if (column.primaryKey) {
        result += `    @Id\n`
        if (column.autoIncrement) {
          result += `    @GeneratedValue(strategy = GenerationType.IDENTITY)\n`
        }
      }
      result += `    @Column(name = "${column.name}"${column.nullable ? '' : ', nullable = false'})\n`
    }

    result += `    private ${javaType} ${fieldName};\n\n`
  }

  if (!options.value.useLombok && (options.value.generateGettersSetters || options.value.generateConstructors)) {
    // 生成 Getter/Setter
    if (options.value.generateGettersSetters) {
      for (const column of parsedTable.value.columns) {
        const javaType = mapDataType(column.type, 'java')
        const fieldName = toCamelCase(column.name)
        const fieldNameUpper = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)

        result += `\n    public ${javaType} get${fieldNameUpper}() {\n`
        result += `        return ${fieldName};\n`
        result += `    }\n`

        result += `\n    public void set${fieldNameUpper}(${javaType} ${fieldName}) {\n`
        result += `        this.${fieldName} = ${fieldName};\n`
        result += `    }\n`
      }
    }

    // 生成构造函数
    if (options.value.generateConstructors) {
      const fields = parsedTable.value.columns.map(col => toCamelCase(col.name))
      const types = parsedTable.value.columns.map(col => mapDataType(col.type, 'java'))

      result += `\n    public ${parsedTable.value.className}() {\n`
      result += `    }\n`

      result += `\n    public ${parsedTable.value.className}(${types.join(', ')} ${fields.join(', ')}) {\n`
      for (const column of parsedTable.value.columns) {
        const fieldName = toCamelCase(column.name)
        result += `        this.${fieldName} = ${fieldName};\n`
      }
      result += `    }\n`
    }
  }

  result += '}'

  return result
}

// 生成 Python Model
const generatePythonModel = () => {
  if (!parsedTable.value) return ''

  let result = 'from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric\n'
  result += 'from sqlalchemy.ext.declarative import declarative_base\n\n'
  result += 'Base = declarative_base()\n\n'
  result += `class ${parsedTable.value.className}(Base):\n`
  result += `    __tablename__ = '${parsedTable.value.tableName}'\n\n`

  for (const column of parsedTable.value.columns) {
    const pythonType = mapDataType(column.type, 'python')
    let sqlalchemyType = 'String'

    if (column.type.includes('int')) {
      sqlalchemyType = column.type.includes('bigint') ? 'BigInteger' : 'Integer'
    } else if (column.type.includes('varchar') || column.type.includes('char')) {
      const lengthMatch = column.type.match(/\((\d+)\)/)
      sqlalchemyType = `String(${lengthMatch ? lengthMatch[1] : 255})`
    } else if (column.type.includes('text')) {
      sqlalchemyType = 'Text'
    } else if (column.type.includes('decimal') || column.type.includes('double')) {
      sqlalchemyType = 'Numeric'
    } else if (column.type.includes('float')) {
      sqlalchemyType = 'Float'
    } else if (column.type.includes('boolean') || column.type.includes('tinyint(1)')) {
      sqlalchemyType = 'Boolean'
    } else if (column.type.includes('date') || column.type.includes('timestamp')) {
      sqlalchemyType = 'DateTime'
    }

    const options = []
    if (column.primaryKey) options.push('primary_key=True')
    if (column.autoIncrement) options.push('autoincrement=True')
    if (!column.nullable) options.push('nullable=False')
    if (column.defaultValue !== null) options.push(`default=${column.defaultValue}`)

    result += `    ${column.name} = Column(${sqlalchemyType}${options.length ? ', ' + options.join(', ') : ''})\n`
  }

  result += '\n    def __repr__(self):\n'
  result += `        return f"<${parsedTable.value.className}(id={self.id})>"\n`

  return result
}

// 生成 C# Model
const generateCSharpModel = () => {
  if (!parsedTable.value) return ''

  let result = 'using System;\n'
  result += 'using System.ComponentModel.DataAnnotations;\n'
  result += 'using System.ComponentModel.DataAnnotations.Schema;\n\n'

  result += `public class ${parsedTable.value.className}\n{\n`

  for (const column of parsedTable.value.columns) {
    const csharpType = mapDataType(column.type, 'csharp')
    const propertyName = toPascalCase(column.name)

    if (column.primaryKey) {
      result += `    [Key]\n`
      if (column.autoIncrement) {
        result += `    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]\n`
      }
    }
    result += `    [Column("${column.name}"])\n`

    result += `    public ${csharpType} ${propertyName} { get; set; }\n\n`
  }

  result += '}'

  return result
}

// 生成 TypeScript Model
const generateTypeScriptModel = () => {
  if (!parsedTable.value) return ''

  let result = `export interface ${parsedTable.value.className} {\n`

  for (const column of parsedTable.value.columns) {
    const tsType = mapDataType(column.type, 'typescript')
    const propertyName = toCamelCase(column.name)
    const optional = column.nullable ? '?' : ''

    result += `    ${propertyName}${optional}: ${tsType};\n`
  }

  result += '}'

  return result
}

// 生成 PHP Model
const generatePHPModel = () => {
  if (!parsedTable.value) return ''

  let result = `<?php\n\n`
  result += `namespace App\Models;\n\n`
  result += `use Illuminate\Database\Eloquent\Model;\n\n`
  result += `class ${parsedTable.value.className} extends Model\n{\n`
  result += `    protected $table = '${parsedTable.value.tableName}';\n`
  result += `    protected $fillable = [\n`

  const fillable = parsedTable.value.columns
    .filter(col => !col.autoIncrement)
    .map(col => `        '${col.name}'`)
    .join(',\n')

  result += fillable + '\n    ];\n'

  result += '\n    protected $casts = [\n'
  const casts = []
  for (const column of parsedTable.value.columns) {
    const phpType = mapDataType(column.type, 'php')
    if (phpType !== 'string') {
      casts.push(`        '${column.name}' => '${phpType}'`)
    }
  }
  if (casts.length > 0) {
    result += casts.join(',\n') + '\n'
  }
  result += '    ];\n'

  result += '\n    public $timestamps = false;\n'

  result += '\n}\n'

  return result
}

// 生成 Go Model
const generateGoModel = () => {
  if (!parsedTable.value) return ''

  let result = 'package models\n\n'
  result += 'import "time"\n\n'

  result += `type ${parsedTable.value.className} struct {\n`

  for (const column of parsedTable.value.columns) {
    const goType = mapDataType(column.type, 'go')
    const propertyName = toPascalCase(column.name)

    let tags = []
    tags.push(`json:"${column.name}"`)
    tags.push(`gorm:"column:${column.name}`)

    if (column.primaryKey) tags.push('primaryKey')
    if (column.autoIncrement) tags.push('autoIncrement')
    if (!column.nullable) tags.push('not null')
    if (column.defaultValue !== null) tags.push(`default:${column.defaultValue}`)

    tags.push('"')

    result += `    ${propertyName} ${goType} \` ${tags.join(' ')} \`\n`
  }

  result += '}\n'

  result += `\nfunc (m *${parsedTable.value.className}) TableName() string {\n`
  result += `    return "${parsedTable.value.tableName}"\n`
  result += '}\n'

  return result
}

// 加载示例
const loadExample = () => {
  sqlInput.value = exampleSql
}

// 清空 SQL
const clearSql = () => {
  sqlInput.value = ''
  parsedTable.value = null
}

// 复制 Model
const copyModel = async () => {
  try {
    await navigator.clipboard.writeText(generatedModel.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 下载 Model
const downloadModel = () => {
  const content = generatedModel.value
  let filename = `${parsedTable.value.className}.${getFileExtension()}`
  const mimeType = 'text/plain'

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 获取文件扩展名
const getFileExtension = () => {
  switch (selectedLanguage.value) {
    case 'java': return 'java'
    case 'python': return 'py'
    case 'csharp': return 'cs'
    case 'typescript': return 'ts'
    case 'php': return 'php'
    case 'go': return 'go'
    default: return 'txt'
  }
}

// 监听 SQL 输入变化
watch(sqlInput, (newVal) => {
  parsedTable.value = parseSQL(newVal)
})

// SEO配置
useSeoMeta({
  title: 'SQL 转 Model 类 - 在线代码生成工具',
  description: '免费的在线 SQL 转 Model 类工具，支持将 CREATE TABLE 语句转换为 Java、Python、C#、TypeScript、PHP、Go 等多种编程语言的实体类。',
  keywords: ['sql', 'model', '代码生成', 'java', 'python', 'csharp', 'typescript', 'php', 'go', 'orm']
})


</script>