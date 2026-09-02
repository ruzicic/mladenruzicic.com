"use client"

import { useEffect, useRef, type RefObject } from "react"

import { play } from "../sound/sound"
import { RAIL_HEIGHT } from "./span"

/**
 * The calm-mode easter egg — docs/v3-redesign-plan.md §3, §5.8.
 *
 * Lazily imported and only mounted while toggled on, so its code never ships to
 * a visitor who does not press Play. The ball bounces off the top edge of the
 * band row (y = 172) exactly as in the design, and the floor flashes on impact.
 *
 * `aria-hidden` and `pointer-events: none`: it is decoration over the rail, and
 * nothing in it is the only route to any content. It makes no sound unless the
 * sound toggle is on (`play()` is a no-op otherwise).
 */

const FLOOR_Y = 172
const PADDLE_Y = 14
const PADDLE_HALF = 40
const BALL_R = 6

export interface PongProps {
  /** Pointer X inside the rail, in px. The paddle follows it. */
  pointerX: RefObject<number>
}

export function Pong({ pointerX }: PongProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const box = canvas?.parentElement
    if (!canvas || !box) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.height = RAIL_HEIGHT
    canvas.width = box.clientWidth

    // The 2D context needs a literal colour, so read the token once.
    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-accent")
        .trim() || "#F5DF4D"

    const ball = { x: canvas.width / 2, y: 60, vx: 3.2, vy: 3.4 }
    let flash = 0
    let frame = 0

    const loop = () => {
      frame = requestAnimationFrame(loop)

      if (canvas.width !== box.clientWidth) canvas.width = box.clientWidth
      const width = canvas.width
      const paddleX = Math.max(
        PADDLE_HALF,
        Math.min(width - PADDLE_HALF, pointerX.current || width / 2)
      )

      ball.x += ball.vx
      ball.y += ball.vy

      if (ball.x < BALL_R || ball.x > width - BALL_R) {
        ball.vx *= -1
        play("pongWall")
      }
      if (ball.y > FLOOR_Y - BALL_R) {
        ball.vy = -Math.abs(ball.vy) * 1.02
        ball.y = FLOOR_Y - BALL_R
        flash = 1
        play("pongFloor")
      }
      if (
        ball.y < PADDLE_Y + 8 + BALL_R &&
        Math.abs(ball.x - paddleX) < PADDLE_HALF + 4
      ) {
        ball.vy = Math.abs(ball.vy)
        ball.vx += (ball.x - paddleX) / 30
        play("pongPaddle")
      }
      if (ball.y < -20) {
        ball.x = width / 2
        ball.y = 60
        ball.vx = 3.2 * (Math.random() > 0.5 ? 1 : -1)
        ball.vy = 3.4
      }

      ctx.clearRect(0, 0, width, RAIL_HEIGHT)
      ctx.fillStyle = accent
      ctx.fillRect(paddleX - PADDLE_HALF, PADDLE_Y, PADDLE_HALF * 2, 4)
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
      ctx.fill()

      if (flash > 0) {
        ctx.strokeStyle = accent
        ctx.globalAlpha = flash
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, FLOOR_Y + 1)
        ctx.lineTo(width, FLOOR_Y + 1)
        ctx.stroke()
        ctx.globalAlpha = 1
        flash -= 0.06
      }
    }

    loop()
    return () => cancelAnimationFrame(frame)
  }, [pointerX])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 h-[270px] w-full"
    />
  )
}
