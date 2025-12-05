import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import express from 'express'
import { setupAuth, isAuthenticated, getUserFromSession } from './replitAuth'
import { storage } from './storage'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '5000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

function log(message: string, source = 'next') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  console.log(`${formattedTime} [${source}] ${message}`)
}

app.prepare().then(async () => {
  const expressApp = express()
  expressApp.use(express.json())
  
  // Health check endpoint for deployment
  expressApp.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
  })
  
  // Setup auth routes (/api/login, /api/callback, /api/logout)
  await setupAuth(expressApp)
  
  // Auth user endpoint
  expressApp.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const userSession = getUserFromSession(req)
      const userId = userSession?.claims?.sub
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" })
      }
      const user = await storage.getUser(userId)
      res.json(user)
    } catch (error) {
      console.error("Error fetching user:", error)
      res.status(500).json({ message: "Failed to fetch user" })
    }
  })
  
  // Generations API - list all generations for a user
  expressApp.get('/api/generations', isAuthenticated, async (req, res) => {
    try {
      const userSession = getUserFromSession(req)
      const userId = userSession?.claims?.sub
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" })
      }
      const generations = await storage.getGenerations(userId)
      res.json(generations)
    } catch (error) {
      console.error("Error fetching generations:", error)
      res.status(500).json({ message: "Failed to fetch generations" })
    }
  })
  
  // Save a new generation
  expressApp.post('/api/generations', isAuthenticated, async (req, res) => {
    try {
      const userSession = getUserFromSession(req)
      const userId = userSession?.claims?.sub
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" })
      }
      const { toolType, inputs, output } = req.body
      const generation = await storage.createGeneration({
        userId,
        toolType,
        inputs,
        output,
      })
      res.json(generation)
    } catch (error) {
      console.error("Error creating generation:", error)
      res.status(500).json({ message: "Failed to save generation" })
    }
  })
  
  // Delete a generation
  expressApp.delete('/api/generations/:id', isAuthenticated, async (req, res) => {
    try {
      const userSession = getUserFromSession(req)
      const userId = userSession?.claims?.sub
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" })
      }
      const generationId = parseInt(req.params.id, 10)
      const generation = await storage.getGeneration(generationId)
      if (!generation) {
        return res.status(404).json({ message: "Generation not found" })
      }
      if (generation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" })
      }
      await storage.deleteGeneration(generationId)
      res.json({ success: true })
    } catch (error) {
      console.error("Error deleting generation:", error)
      res.status(500).json({ message: "Failed to delete generation" })
    }
  })
  
  // Handle all other routes with Next.js
  expressApp.all('*', (req, res) => {
    const parsedUrl = parse(req.url!, true)
    return handle(req, res, parsedUrl)
  })
  
  createServer(expressApp)
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      log(`serving on port ${port}`)
    })
})
