import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'

const pythonApiPlugin = () => ({
  name: 'python-api',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url === '/api/build-python' && req.method === 'POST') {
        
        let body = ''
        req.on('data', (chunk: any) => {
          body += chunk.toString()
        })

        req.on('end', () => {
          try {
            const slideData = JSON.parse(body)
            
            // Create a temp JSON file
            const tempJsonPath = path.resolve(__dirname, `temp_${Date.now()}.json`)
            fs.writeFileSync(tempJsonPath, JSON.stringify(slideData))

            // Execute python bridge
            const scriptPath = path.resolve(__dirname, 'build-from-json.py')
            exec(`python "${scriptPath}" "${tempJsonPath}"`, (error, stdout, stderr) => {
              // Clean up JSON temp
              if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath)

              if (error) {
                console.error(`Python Error: ${stderr}`)
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Failed to build presentation via python-pptx' }))
                return
              }

              const outPath = stdout.trim()
              if (fs.existsSync(outPath)) {
                // Read pptx and send to client
                const fileBuffer = fs.readFileSync(outPath)
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
                res.setHeader('Content-Disposition', 'attachment; filename="presentation.pptx"')
                res.end(fileBuffer)

                // Clean up PPTX temp
                fs.unlinkSync(outPath)
              } else {
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Generated file not found' }))
              }
            })
          } catch (e: any) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      } else {
        next()
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), pythonApiPlugin()],
})
