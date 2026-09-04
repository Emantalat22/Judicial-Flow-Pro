import { useEffect, useRef, useState } from 'react'

/**
 * CustomCursor
 * Premium two-layer custom gold cursor for Judicial Flow Pro:
 * 1. Inner Gold Center Dot (immediately tracks mouse position)
 * 2. Outer Gold Ring (smooth magnetic interpolation with subtle lag)
 *
 * Performance-optimized:
 * - 0 React re-renders on mousemove (direct DOM transform in requestAnimationFrame)
 * - pointer-events: none ensures zero interference with clicks or text selection
 * - Automatically disabled on touch / mobile devices (pointer: coarse)
 * - Respects prefers-reduced-motion
 */
export default function CustomCursor() {
  const [isEnabled, setIsEnabled] = useState(false)

  const dotWrapperRef = useRef(null)
  const dotChildRef = useRef(null)
  const ringWrapperRef = useRef(null)
  const ringChildRef = useRef(null)

  const mousePos = useRef({ x: -100, y: -100 })
  const ringPos = useRef({ x: -100, y: -100 })

  const stateRef = useRef({
    isHovering: false,
    isClicking: false,
    isTextInput: false,
    isVisible: false,
  })

  useEffect(() => {
    // Check if device supports fine pointer (mouse / trackpad)
    const mediaFine = window.matchMedia('(pointer: fine)')
    if (!mediaFine.matches) {
      return
    }

    setIsEnabled(true)

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let isReducedMotion = motionQuery.matches

    const onMotionChange = (e) => {
      isReducedMotion = e.matches
    }
    motionQuery.addEventListener('change', onMotionChange)

    let rafId = null

    // Track mouse position and detect interactive/input elements
    const handleMouseMove = (e) => {
      mousePos.current.x = e.clientX
      mousePos.current.y = e.clientY

      if (!stateRef.current.isVisible) {
        stateRef.current.isVisible = true
      }

      const target = e.target
      if (!target) return

      // Text inputs, textareas, and editable fields
      const textInput = target.closest(
        'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
      )
      const isText = Boolean(textInput)

      // Interactive targets: links, buttons, clickable controls, 3D lift cards
      const interactiveEl = target.closest(
        'a, button, [role="button"], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select, .cursor-pointer, [data-cursor-interactive], .card-3d-lift, .nav-item-3d-active'
      )
      const isDisabled = target.closest(':disabled, [aria-disabled="true"]')
      const isInteractive = Boolean(interactiveEl && !isDisabled && !isText)

      stateRef.current.isTextInput = isText
      stateRef.current.isHovering = isInteractive
    }

    const handleMouseDown = () => {
      stateRef.current.isClicking = true
    }

    const handleMouseUp = () => {
      stateRef.current.isClicking = false
    }

    const handleMouseEnter = () => {
      stateRef.current.isVisible = true
    }

    const handleMouseLeave = () => {
      stateRef.current.isVisible = false
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    // Animation Loop
    const loop = () => {
      const targetX = mousePos.current.x
      const targetY = mousePos.current.y

      // Lerp outer ring toward mouse position
      const lerp = isReducedMotion ? 1 : 0.18
      ringPos.current.x += (targetX - ringPos.current.x) * lerp
      ringPos.current.y += (targetY - ringPos.current.y) * lerp

      const { isHovering, isClicking, isTextInput, isVisible } = stateRef.current

      // Update Dot
      if (dotWrapperRef.current && dotChildRef.current) {
        dotWrapperRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`
        dotWrapperRef.current.style.opacity = isVisible && !isTextInput ? '1' : '0'

        if (isClicking) {
          dotChildRef.current.classList.add('cursor-click')
        } else {
          dotChildRef.current.classList.remove('cursor-click')
        }

        if (isHovering) {
          dotChildRef.current.classList.add('cursor-hover')
        } else {
          dotChildRef.current.classList.remove('cursor-hover')
        }
      }

      // Update Ring
      if (ringWrapperRef.current && ringChildRef.current) {
        ringWrapperRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`
        ringWrapperRef.current.style.opacity = isVisible && !isTextInput ? '1' : '0'

        if (isClicking) {
          ringChildRef.current.classList.add('cursor-click')
        } else {
          ringChildRef.current.classList.remove('cursor-click')
        }

        if (isHovering) {
          ringChildRef.current.classList.add('cursor-hover')
        } else {
          ringChildRef.current.classList.remove('cursor-hover')
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
      motionQuery.removeEventListener('change', onMotionChange)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  if (!isEnabled) {
    return null
  }

  return (
    <>
      {/* Outer Interpolating Gold Ring */}
      <div
        ref={ringWrapperRef}
        className="custom-cursor-ring-wrapper"
        aria-hidden="true"
      >
        <div ref={ringChildRef} className="custom-cursor-ring" />
      </div>

      {/* Inner Immediate Gold Dot */}
      <div
        ref={dotWrapperRef}
        className="custom-cursor-dot-wrapper"
        aria-hidden="true"
      >
        <div ref={dotChildRef} className="custom-cursor-dot" />
      </div>
    </>
  )
}
