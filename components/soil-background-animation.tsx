"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  type: "soil" | "leaf" | "seed" | "nutrient"
  rotation: number
  rotationSpeed: number
}

export function SoilBackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticle = (): Particle => {
      const types: Particle["type"][] = ["soil", "soil", "soil", "leaf", "seed", "nutrient"]
      const type = types[Math.floor(Math.random() * types.length)]

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: type === "soil" ? Math.random() * 3 + 1 : Math.random() * 6 + 3,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: Math.random() * 0.2 + 0.05,
        opacity: Math.random() * 0.3 + 0.1,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      }
    }

    const initParticles = () => {
      particles = []
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000)
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle())
      }
    }

    const drawSoilParticle = (p: Particle) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(139, 90, 43, ${p.opacity})`
      ctx.fill()
    }

    const drawLeafParticle = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.6, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(76, 175, 80, ${p.opacity})`
      ctx.fill()
      ctx.restore()
    }

    const drawSeedParticle = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * 0.4, p.size * 0.8, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(210, 180, 140, ${p.opacity})`
      ctx.fill()
      ctx.restore()
    }

    const drawNutrientParticle = (p: Particle) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(100, 200, 150, ${p.opacity * 1.5})`
      ctx.fill()

      // Glow effect
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(100, 200, 150, ${p.opacity * 0.3})`
      ctx.fill()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        // Update position
        p.x += p.speedX
        p.y += p.speedY
        p.rotation += p.rotationSpeed

        // Wrap around edges
        if (p.y > canvas.height + 10) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        // Draw based on type
        switch (p.type) {
          case "soil":
            drawSoilParticle(p)
            break
          case "leaf":
            drawLeafParticle(p)
            break
          case "seed":
            drawSeedParticle(p)
            break
          case "nutrient":
            drawNutrientParticle(p)
            break
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    initParticles()
    animate()

    window.addEventListener("resize", () => {
      resizeCanvas()
      initParticles()
    })

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10">
      <canvas ref={canvasRef} className="w-full h-full pointer-events-none" aria-hidden="true" />
    </div>
  )
}
