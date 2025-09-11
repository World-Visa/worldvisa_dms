import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin)
}

// GSAP utility functions
export const gsapUtils = {
  // Fade in animation
  fadeIn: (element: string | Element, duration = 1, delay = 0) => {
    return gsap.fromTo(
      element,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration, delay, ease: 'power2.out' }
    )
  },

  // Fade out animation
  fadeOut: (element: string | Element, duration = 1, delay = 0) => {
    return gsap.to(element, {
      opacity: 0,
      y: -20,
      duration,
      delay,
      ease: 'power2.in',
    })
  },

  // Slide in from left
  slideInLeft: (element: string | Element, duration = 1, delay = 0) => {
    return gsap.fromTo(
      element,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration, delay, ease: 'power2.out' }
    )
  },

  // Slide in from right
  slideInRight: (element: string | Element, duration = 1, delay = 0) => {
    return gsap.fromTo(
      element,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration, delay, ease: 'power2.out' }
    )
  },

  // Scale animation
  scaleIn: (element: string | Element, duration = 1, delay = 0) => {
    return gsap.fromTo(
      element,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration, delay, ease: 'back.out(1.7)' }
    )
  },

  // Stagger animation for multiple elements
  stagger: (elements: string | Element[], animation: { from: Record<string, unknown>; to: Record<string, unknown> }, stagger = 0.1) => {
    return gsap.fromTo(
      elements,
      animation.from,
      { ...animation.to, stagger }
    )
  },

  // Text typing animation
  typeText: (element: string | Element, text: string, duration = 2) => {
    return gsap.to(element, {
      text: text,
      duration,
      ease: 'none',
    })
  },

  // Scroll-triggered animation
  scrollTrigger: (element: string | Element, animation: { from: Record<string, unknown>; to: Record<string, unknown> }, triggerOptions: Record<string, unknown> = {}) => {
    return gsap.fromTo(element, animation.from, {
      ...animation.to,
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
        ...triggerOptions,
      },
    })
  },
}

// Export GSAP instance for direct use
export { gsap, ScrollTrigger, TextPlugin }
