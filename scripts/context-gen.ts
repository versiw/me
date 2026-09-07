import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const CONFIG = {
  outputPrefix: 'project_context_',
  agentRulesFiles: ['CLAUDE.md', 'AGENTS.md'],
  excludedDirs: [
    'node_modules',
    '.git',
    '.next',
    '.vscode',
    '.idea',
    'dist',
    'build',
    'coverage',
    'public',
    'releases',
    'tmp',
    'temp',
    'generated'
  ],
  excludedFiles: [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    '.DS_Store',
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    'CHANGELOG.md',
    'README.md',
    'LICENSE'
  ],
  excludedExtensions: [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.webp',
    '.mp4',
    '.mov',
    '.mp3',
    '.wav',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.zip',
    '.tar',
    '.gz',
    '.7z',
    '.rar',
    '.exe',
    '.dll',
    '.bin',
    '.class',
    '.jar',
    '.o',
    '.so',
    '.eot',
    '.otf',
    '.ttf',
    '.woff',
    '.woff2'
  ],
  languageMap: {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.jsx': 'jsx',
    '.json': 'json',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.html': 'html',
    '.md': 'markdown'
  } as Record<string, string>
}

const STRICT_MODE_HEADER = `
# ⚠️ 核心指令：在处理以下代码前必读
1. **规范优先**：下方包含的 **AGENTS.md** 是本项目开发的唯一事实来源。
2. **环境感知**：请优先分析项目配置。
3. **回答准则**：严格遵守 AGENTS.md 中定义的规范。
4. **最小改动**：严禁修改无关文件。
---
`

function getLanguage(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  return CONFIG.languageMap[ext] || ''
}

/** 粗略估算 token 数：英文字符 ×0.3 + 中文字符 ×0.6 */
function estimateTokens(text: string): number {
  let chinese = 0
  let english = 0
  for (const ch of text) {
    if (ch >= '一' && ch <= '鿿') {
      chinese++
    } else if (!/[\s\r\n]/.test(ch)) {
      english++
    }
  }
  return Math.ceil(chinese * 0.6 + english * 0.3)
}

/** 格式化数字：≥1M 显示 X.X M，≥1K 显示 X.X K，否则原样 */
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`
  return String(n)
}

/**
 * 核心修改：兼容 Linux SSH 的复制逻辑，并增强错误处理
 */
function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve) => {
    /** 删除临时文件（静默失败） */
    function cleanupTempFile(file: string | null) {
      if (!file) return
      try {
        fs.unlinkSync(file)
      } catch {
        /* ignore */
      }
    }

    // 1. 优先尝试 OSC 52 (跨 SSH 复制到本地的最原生方式)
    if (process.platform === 'linux' || process.env.SSH_TTY) {
      try {
        const base64Text = Buffer.from(text).toString('base64')
        // OSC 52 序列格式: \x1b]52;c;[BASE64]\x07
        process.stdout.write(`\x1b]52;c;${base64Text}\x07`)

        // 如果是 Linux 但不是 SSH，尝试 xclip 做兜底
        if (!process.env.SSH_TTY) {
          const xclip = spawn('xclip', ['-selection', 'clipboard'])

          // 监听子进程的 error 事件（例如命令未安装）
          xclip.on('error', () => {
            // 吞掉错误以防止进程崩溃
          })

          if (xclip.stdin) {
            // 监听写入流的 error 事件（例如管道破裂 EPIPE）
            xclip.stdin.on('error', () => {
              // 吞掉错误
            })
            xclip.stdin.write(text)
            xclip.stdin.end()
          }
        }
        resolve()
        return
      } catch {
        // 如果 OSC 52 失败，继续尝试其他方案
      }
    }

    // 2. 本地操作系统命令
    let command = ''
    let args: string[] = []
    let tempFile: string | null = null

    switch (process.platform) {
      case 'win32': {
        // 写入临时文件，避免命令行参数超长 (ENAMETOOLONG)
        tempFile = path.join(
          os.tmpdir(),
          `ctx_${Date.now()}_${process.pid}_${Math.random().toString(36).slice(2, 8)}.txt`
        )
        fs.writeFileSync(tempFile, text, 'utf8')
        command = 'powershell'
        args = [
          '-NoProfile',
          '-Command',
          `Get-Content -Path '${tempFile}' -Raw -Encoding UTF8 | Set-Clipboard`
        ]
        break
      }
      case 'darwin':
        command = 'pbcopy'
        break
      default:
        resolve()
        return
    }

    const child = spawn(command, args)
    child.on('error', () => {
      cleanupTempFile(tempFile)
      resolve()
    })

    if (child.stdin) {
      // 同样为标准输入流和子进程增加错误捕获
      child.stdin.on('error', () => {
        // 吞掉由于管道提早关闭导致的错误
      })
      child.stdin.write(text, 'utf8')
      child.stdin.end()
    }
    child.on('close', () => {
      cleanupTempFile(tempFile)
      resolve()
    })
  })
}

function generateContextForPath(
  targetPath: string,
  rootDir: string
): { content: string; fileCount: number } {
  const fullPath = path.resolve(rootDir, targetPath)
  if (!fs.existsSync(fullPath)) return { content: '', fileCount: 0 }

  const builder: string[] = []
  let fileCount = 0
  const readFile = (filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      if (content.includes('\0')) return
      const relativePath = path.relative(rootDir, filePath)
      builder.push(
        `# File: ${relativePath}\n\n\`\`\`${getLanguage(filePath)}\n${content}\n\`\`\`\n---\n`
      )
      fileCount++
    } catch {}
  }

  const traverse = (currentPath: string) => {
    const stats = fs.statSync(currentPath)
    if (stats.isFile()) {
      readFile(currentPath)
      return
    }
    const entries = fs.readdirSync(currentPath)
    for (const entry of entries) {
      if (CONFIG.excludedDirs.includes(entry) || CONFIG.excludedFiles.includes(entry)) continue
      const ext = path.extname(entry).toLowerCase()
      if (CONFIG.excludedExtensions.includes(ext)) continue
      const entryFullPath = path.join(currentPath, entry)
      if (fs.statSync(entryFullPath).isDirectory()) {
        traverse(entryFullPath)
      } else {
        readFile(entryFullPath)
      }
    }
  }

  traverse(fullPath)
  return { content: builder.join('\n'), fileCount }
}

async function main() {
  const args = process.argv.slice(2)
  const rootDir = process.cwd()

  console.log(`\n\x1b[36m%s\x1b[0m`, ` 🛠️  AI Context Generator`)
  console.log(`\x1b[90m%s\x1b[0m`, ` -----------------------------------------`)

  let finalContent = ''
  let totalFiles = 0

  // 按优先级依次查找：CLAUDE.md > AGENTS.md
  let foundAgentFile = ''
  for (const file of CONFIG.agentRulesFiles) {
    const filePath = path.join(rootDir, file)
    if (fs.existsSync(filePath)) {
      foundAgentFile = file
      break
    }
  }

  if (foundAgentFile) {
    const agentsPath = path.join(rootDir, foundAgentFile)
    const agentsContent = fs.readFileSync(agentsPath, 'utf8')
    const header = STRICT_MODE_HEADER.replace(/AGENTS\.md/g, foundAgentFile)
    finalContent = header
    finalContent += `# File: ${foundAgentFile} (GLOBAL RULES)\n\n\`\`\`markdown\n${agentsContent}\n\`\`\`\n\n${'='.repeat(50)}\n\n`
    console.log(` \x1b[32m✔\x1b[0m 检测到规范文档: ${foundAgentFile} (已自动置顶)`)
  }

  for (const target of args) {
    if (
      CONFIG.agentRulesFiles.includes(target) ||
      CONFIG.agentRulesFiles.includes(path.basename(target))
    )
      continue
    console.log(` \x1b[34m•\x1b[0m 正在处理: ${target}`)
    const { content, fileCount } = generateContextForPath(target, rootDir)
    totalFiles += fileCount
    if (content) finalContent += content + `\n${'='.repeat(50)}\n\n`
  }

  if (finalContent) {
    await copyToClipboard(finalContent)
    const lineCount = finalContent.split('\n').length
    const tokens = estimateTokens(finalContent)
    console.log(`\x1b[90m%s\x1b[0m`, ` -----------------------------------------`)
    console.log(` \x1b[32m✨ 成功！上下文已发送至本地剪切板\x1b[0m`)
    console.log(``)
    console.log(` \x1b[36m📦  文件数\x1b[0m         ${totalFiles}`)
    console.log(` \x1b[36m📏  总行数\x1b[0m         ${formatNumber(lineCount)}`)
    console.log(` \x1b[36m🔮  预估 Tokens\x1b[0m    ${formatNumber(tokens)}`)
    console.log(`\x1b[90m%s\x1b[0m`, ` -----------------------------------------`)
    console.log(` \x1b[33m👉 如果终端未自动复制，请检查终端 OSC 52 权限。\x1b[0m\n`)
  } else {
    console.log(` \x1b[31m✘\x1b[0m 未发现有效内容。`)
  }
}

void main()
